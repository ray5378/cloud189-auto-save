const ConfigService = require('./ConfigService');
const { logTaskEvent } = require('../utils/logUtils');

class EmbyPrewarmService {
    constructor(embyService) {
        this.embyService = embyService;
        this.timer = null;
        this.prewarmDedupe = new Map();
        this.sessionDedupe = new Map();
    }

    _refreshConfig() {
        this.enabled = !!ConfigService.getConfigValue('emby.prewarm.enable');
        this.sessionPollIntervalMs = Number(ConfigService.getConfigValue('emby.prewarm.sessionPollIntervalMs')) || 30000;
        this.dedupeTtlMs = Number(ConfigService.getConfigValue('emby.prewarm.dedupeTtlMs')) || 300000;
    }

    _pruneExpired(map) {
        const now = Date.now();
        for (const [key, expiresAt] of map.entries()) {
            if (expiresAt <= now) {
                map.delete(key);
            }
        }
    }

    _markDedupe(map, key) {
        if (!key) {
            return;
        }
        if (map.size > 200) {
            this._pruneExpired(map);
        }
        map.set(key, Date.now() + this.dedupeTtlMs);
    }

    _hasValidDedupe(map, key) {
        if (!key) {
            return false;
        }
        const expiresAt = map.get(key);
        if (!expiresAt) {
            return false;
        }
        if (expiresAt <= Date.now()) {
            map.delete(key);
            return false;
        }
        return true;
    }

    stopPolling() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    startPolling() {
        this._refreshConfig();
        this.embyService?._refreshConfig?.();
        this.stopPolling();

        if (!this.enabled) {
            return;
        }

        if (!this.embyService?.embyUrl || !this.embyService?.embyApiKey) {
            logTaskEvent('Emby预热未启动: Emby 地址或 API Key 未配置');
            return;
        }

        const intervalMs = Math.max(10000, this.sessionPollIntervalMs);
        this.timer = setInterval(() => {
            this._pollSessionsOnce().catch((error) => {
                logTaskEvent(`Emby预热轮询失败: ${error.message}`);
            });
        }, intervalMs);
    }

    async reload() {
        this._refreshConfig();
        this.embyService?._refreshConfig?.();
        this.stopPolling();
        this._pruneExpired(this.prewarmDedupe);
        this._pruneExpired(this.sessionDedupe);
        if (this.enabled) {
            await this._pollSessionsOnce().catch((error) => {
                logTaskEvent(`Emby预热首次轮询失败: ${error.message}`);
            });
            this.startPolling();
        }
    }

    async schedulePrewarm(context = {}) {
        this._refreshConfig();
        if (!this.enabled) {
            return;
        }
        queueMicrotask(() => {
            this.prewarmNextEpisode(context).catch((error) => {
                logTaskEvent(`Emby预热失败: ${error.message}`);
            });
        });
    }

    async prewarmNextEpisode({ itemId, userId = '', source = 'unknown' } = {}) {
        this._refreshConfig();
        if (!this.enabled || !itemId) {
            return;
        }

        const currentItem = await this.embyService.getItemById(itemId);
        if (!currentItem || String(currentItem.Type) !== 'Episode') {
            return;
        }

        const nextEpisode = await this._resolveNextEpisode(currentItem, userId);
        if (!nextEpisode?.Id) {
            return;
        }

        const prewarmKey = `item:${nextEpisode.Id}`;
        if (this._hasValidDedupe(this.prewarmDedupe, prewarmKey)) {
            return;
        }

        await this.embyService.resolveDirectUrlByItemId(nextEpisode.Id);
        this._markDedupe(this.prewarmDedupe, prewarmKey);
        const season = Number(nextEpisode.ParentIndexNumber || 0);
        const episode = Number(nextEpisode.IndexNumber || 0);
        const episodeLabel = season > 0 && episode > 0
            ? `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
            : (nextEpisode.Name || nextEpisode.Id);
        logTaskEvent(`Emby预热下一集成功[${source}]: ${episodeLabel}`);
    }

    async _pollSessionsOnce() {
        this._refreshConfig();
        if (!this.enabled || !this.embyService?.embyUrl || !this.embyService?.embyApiKey) {
            return;
        }

        const sessions = await this.embyService.request(`${this.embyService.embyUrl}/Sessions`, {
            method: 'GET'
        });
        if (!Array.isArray(sessions)) {
            return;
        }

        for (const session of sessions) {
            const nowPlayingItem = session?.NowPlayingItem;
            if (!nowPlayingItem?.Id || String(nowPlayingItem.Type) !== 'Episode') {
                continue;
            }
            const sessionId = String(session?.Id || session?.PlayState?.PlaySessionId || session?.DeviceId || '');
            const sessionKey = `session:${sessionId}:${nowPlayingItem.Id}`;
            if (this._hasValidDedupe(this.sessionDedupe, sessionKey)) {
                continue;
            }
            this._markDedupe(this.sessionDedupe, sessionKey);
            await this.prewarmNextEpisode({
                itemId: nowPlayingItem.Id,
                userId: session?.UserId || '',
                source: 'sessions'
            });
        }
    }

    async _resolveNextEpisode(currentItem, userId = '') {
        const seriesId = currentItem?.SeriesId || currentItem?.Series?.Id;
        if (!seriesId) {
            return null;
        }

        const nextUpEpisode = await this._getNextUpEpisode(userId, seriesId, currentItem.Id);
        if (nextUpEpisode?.Id) {
            return nextUpEpisode;
        }

        return await this._findNextEpisodeFromSeriesList(currentItem);
    }

    async _getNextUpEpisode(userId, seriesId, currentItemId) {
        if (!userId || !seriesId) {
            return null;
        }

        const response = await this.embyService.request(`${this.embyService.embyUrl}/Shows/NextUp`, {
            method: 'GET',
            searchParams: {
                UserId: userId,
                SeriesId: seriesId,
                Limit: 3,
                Fields: 'Path,MediaSources'
            }
        });
        const items = Array.isArray(response?.Items) ? response.Items : [];
        return items.find((item) => item?.Id && item.Id !== currentItemId && String(item.Type) === 'Episode') || null;
    }

    async _findNextEpisodeFromSeriesList(currentItem) {
        const seriesId = currentItem?.SeriesId || currentItem?.Series?.Id;
        if (!seriesId) {
            return null;
        }

        const response = await this.embyService.request(`${this.embyService.embyUrl}/Shows/${seriesId}/Episodes`, {
            method: 'GET',
            searchParams: {
                Fields: 'Path,MediaSources',
                Limit: 300
            }
        });
        const items = Array.isArray(response?.Items) ? response.Items : [];
        const episodes = items
            .filter((item) => item?.Id && String(item.Type) === 'Episode')
            .sort((left, right) => {
                const seasonDiff = Number(left?.ParentIndexNumber || 0) - Number(right?.ParentIndexNumber || 0);
                if (seasonDiff !== 0) {
                    return seasonDiff;
                }
                return Number(left?.IndexNumber || 0) - Number(right?.IndexNumber || 0);
            });
        const currentIndex = episodes.findIndex((item) => String(item.Id) === String(currentItem.Id));
        if (currentIndex < 0) {
            return null;
        }
        return episodes[currentIndex + 1] || null;
    }
}

module.exports = { EmbyPrewarmService };

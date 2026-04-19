const fs = require('fs').promises;
const path = require('path');

class CasMetadataCacheService {
    constructor() {
        this.baseDir = path.join(__dirname, '../../data/cas-metadata');
    }

    _normalizeKey(payload = {}) {
        return {
            accountId: String(payload.accountId || '').trim(),
            shareId: String(payload.shareId || '').trim(),
            fileId: String(payload.fileId || '').trim()
        };
    }

    _buildFilePath(payload = {}) {
        const key = this._normalizeKey(payload);
        if (!key.accountId || !key.shareId || !key.fileId) {
            return '';
        }
        return path.join(this.baseDir, key.accountId, key.shareId, `${key.fileId}.json`);
    }

    _normalizeMetadata(metadata = {}) {
        const normalized = {
            name: String(metadata.name || '').trim(),
            size: Number(metadata.size || 0) || 0,
            md5: String(metadata.md5 || '').trim().toUpperCase(),
            sliceMd5: String(metadata.sliceMd5 || '').trim().toUpperCase()
        };
        if (!normalized.name || !normalized.size || !normalized.md5 || !normalized.sliceMd5) {
            return null;
        }
        return normalized;
    }

    async get(payload = {}) {
        const filePath = this._buildFilePath(payload);
        if (!filePath) {
            return null;
        }

        try {
            const content = await fs.readFile(filePath, 'utf8');
            const parsed = JSON.parse(content);
            return this._normalizeMetadata(parsed?.metadata || parsed);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            return null;
        }
    }

    async set(payload = {}, metadata = {}) {
        const filePath = this._buildFilePath(payload);
        const normalizedMetadata = this._normalizeMetadata(metadata);
        if (!filePath || !normalizedMetadata) {
            return null;
        }

        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify({
            metadata: normalizedMetadata,
            updatedAt: new Date().toISOString()
        }), 'utf8');
        return normalizedMetadata;
    }
}

module.exports = { CasMetadataCacheService };

import React, { useState, useEffect } from 'react';
import { Zap, Download, Upload, Search, RefreshCw, AlertCircle, CheckCircle2, Copy, FolderOpen, Settings } from 'lucide-react';
import Modal from '../Modal';
import FolderSelector, { SelectedFolder } from '../FolderSelector';

interface Account {
  id: number;
  username: string;
  alias: string;
  accountType: string;
}

interface CasConfig {
  enableAutoRestore: boolean;
  deleteCasAfterRestore: boolean;
  deleteSourceAfterGenerate: boolean;
  enableFamilyTransit: boolean;
  familyTransitFirst: boolean;
}

interface CasTabProps {
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const CasTab: React.FC<CasTabProps> = ({ onShowToast }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // 恢复相关
  const [casContent, setCasContent] = useState('');
  const [restoreName, setRestoreName] = useState('');
  const [targetFolder, setTargetFolder] = useState<SelectedFolder | null>(null);
  const [isFolderSelectorOpen, setIsFolderSelectorOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // 配置相关
  const [config, setConfig] = useState<CasConfig>({
    enableAutoRestore: false,
    deleteCasAfterRestore: true,
    deleteSourceAfterGenerate: false,
    enableFamilyTransit: true,
    familyTransitFirst: false
  });
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchConfig();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      if (data.success) {
        setAccounts(data.data);
        if (data.data.length > 0) {
          setSelectedAccountId(data.data[0].id);
        }
      }
    } catch (e) {
      console.error('获取账号列表失败:', e);
    }
  };

  const fetchConfig = async () => {
    setIsConfigLoading(true);
    try {
      const res = await fetch('/api/cas/auto-restart-config');
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (e) {
      console.error('获取CAS配置失败:', e);
    } finally {
      setIsConfigLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedAccountId || !casContent || !targetFolder) {
      onShowToast?.('请选择账号、填写存根内容并选择目标目录', 'error');
      return;
    }

    setIsRestoring(true);
    try {
      const res = await fetch('/api/cas/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccountId,
          folderId: targetFolder.id,
          casContent: casContent.trim(),
          fileName: restoreName.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowToast?.(`秒传恢复成功: ${data.data.name}`, 'success');
        setCasContent('');
        setRestoreName('');
        setTargetFolder(null);
      } else {
        onShowToast?.('恢复失败: ' + (data.error || '未知错误'), 'error');
      }
    } catch (e) {
      onShowToast?.('操作过程中发生错误', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsConfigLoading(true);
    try {
      const res = await fetch('/api/cas/auto-restart-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        onShowToast?.('配置已保存', 'success');
        setIsConfigOpen(false);
      } else {
        onShowToast?.('保存配置失败: ' + data.error, 'error');
      }
    } catch (e) {
      onShowToast?.('保存配置失败', 'error');
    } finally {
      setIsConfigLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    onShowToast?.('已复制到剪贴板', 'success');
  };

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">CAS 秒传</h2>
          <button
            onClick={() => setIsConfigOpen(true)}
            className="p-2 bg-white border border-slate-300 rounded-full hover:bg-slate-50 transition-all text-slate-600 shadow-sm"
            title="配置"
          >
            <Settings size={18} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {config.enableFamilyTransit ? (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 size={14} /> 家庭中转已启用
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400">
                <AlertCircle size={14} /> 家庭中转已禁用
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 恢复区域 */}
        <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Download className="text-blue-500" size={20} />
              <h3 className="font-bold text-slate-900">秒传恢复</h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">粘贴 .cas 存根内容，恢复原始文件</p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">执行账号</label>
              <select
                value={selectedAccountId || ''}
                onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0b57d0]/20"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.alias || acc.username}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">存根内容 (Base64 或 JSON)</label>
              <textarea
                value={casContent}
                onChange={(e) => setCasContent(e.target.value)}
                placeholder="粘贴 .cas 文件内容..."
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0b57d0]/20 min-h-[120px] font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">自定义文件名 (可选)</label>
              <input
                type="text"
                value={restoreName}
                onChange={(e) => setRestoreName(e.target.value)}
                placeholder="不填则使用存根内的文件名"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0b57d0]/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">存入目录</label>
              <button
                onClick={() => setIsFolderSelectorOpen(true)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm hover:border-[#0b57d0] transition-all"
              >
                <span className={targetFolder ? 'text-slate-900' : 'text-slate-400'}>
                  {targetFolder ? targetFolder.name : '点击选择目标目录'}
                </span>
                <Search size={16} className="text-slate-400" />
              </button>
            </div>

            <button
              onClick={handleRestore}
              disabled={isRestoring || !casContent || !targetFolder}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0b57d0] text-white rounded-xl font-bold text-sm hover:bg-[#0948ad] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRestoring ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Zap size={18} />
              )}
              立即恢复
            </button>
          </div>
        </div>

        {/* 说明区域 */}
        <div className="space-y-6">
          <div className="bg-blue-50 rounded-3xl border border-blue-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="text-blue-500" size={20} />
              <h3 className="font-bold text-blue-900">什么是 CAS 秒传？</h3>
            </div>
            <div className="space-y-3 text-sm text-blue-800">
              <p><strong>.cas 文件</strong>是秒传存根，包含文件名、大小、MD5 与分片 MD5。</p>
              <p>只要天翼云服务端命中相同 Hash，即可直接恢复，不需要重新上传原文件。</p>
              <p className="text-blue-600 text-xs mt-2">提示：如果 Hash 未命中，秒传恢复会失败。</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Zap className="text-amber-500" size={20} />
                <h3 className="font-bold text-slate-900">家庭中转说明</h3>
              </div>
            </div>
            <div className="p-6 space-y-3 text-sm text-slate-600">
              <p>启用家庭中转后，秒传恢复流程：</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>先尝试家庭云秒传</li>
                <li>将文件复制到个人云</li>
                <li>清理家庭云临时文件</li>
              </ol>
              <p className="text-xs text-slate-500 mt-3">适用于个人云被风控或黑名单的情况。</p>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-3xl border border-emerald-100 p-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="text-emerald-500" size={20} />
              <h3 className="font-bold text-emerald-900">当前配置</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className={config.enableFamilyTransit ? 'text-emerald-600' : 'text-slate-400'}>
                  {config.enableFamilyTransit ? '✓' : '✗'} 家庭中转
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={config.familyTransitFirst ? 'text-emerald-600' : 'text-slate-400'}>
                  {config.familyTransitFirst ? '✓' : '✗'} 优先中转
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={config.deleteCasAfterRestore ? 'text-emerald-600' : 'text-slate-400'}>
                  {config.deleteCasAfterRestore ? '✓' : '✗'} 恢复后删除CAS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={config.deleteSourceAfterGenerate ? 'text-emerald-600' : 'text-slate-400'}>
                  {config.deleteSourceAfterGenerate ? '✓' : '✗'} 生成后删除源
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 目录选择器 */}
      <FolderSelector
        isOpen={isFolderSelectorOpen}
        onClose={() => setIsFolderSelectorOpen(false)}
        accountId={selectedAccountId || 0}
        onSelect={(folder) => {
          setTargetFolder(folder);
          setIsFolderSelectorOpen(false);
        }}
        title="选择存入目录"
      />

      {/* 配置弹窗 */}
      <Modal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title="CAS 配置"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsConfigOpen(false)}
              className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={isConfigLoading}
              className="px-6 py-2.5 bg-[#0b57d0] text-white rounded-xl text-sm font-bold hover:bg-[#0948ad] transition-all disabled:opacity-50"
            >
              {isConfigLoading ? '保存中...' : '保存配置'}
            </button>
          </div>
        }
      >
        <div className="space-y-6 py-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-medium text-slate-900">启用家庭中转</p>
                <p className="text-sm text-slate-500 mt-1">秒传时通过家庭云中转，规避风控</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableFamilyTransit}
                  onChange={(e) => setConfig({ ...config, enableFamilyTransit: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0b57d0]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-medium text-slate-900">优先使用家庭中转</p>
                <p className="text-sm text-slate-500 mt-1">默认先尝试家庭云秒传，失败再回退个人</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.familyTransitFirst}
                  onChange={(e) => setConfig({ ...config, familyTransitFirst: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0b57d0]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-medium text-slate-900">恢复后删除 CAS 文件</p>
                <p className="text-sm text-slate-500 mt-1">秒传恢复成功后自动删除 .cas 存根文件</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.deleteCasAfterRestore}
                  onChange={(e) => setConfig({ ...config, deleteCasAfterRestore: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0b57d0]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-medium text-slate-900">生成后删除源文件</p>
                <p className="text-sm text-slate-500 mt-1">生成 .cas 存根后自动删除原始文件</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.deleteSourceAfterGenerate}
                  onChange={(e) => setConfig({ ...config, deleteSourceAfterGenerate: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0b57d0]"></div>
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CasTab;

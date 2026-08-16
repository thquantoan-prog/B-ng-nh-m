import React, { useState } from 'react';
import { X, Globe, Copy, Check, Info } from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  baseUrl: string;
  sessionId: string;
  groupCount: number;
  onUpdateBaseUrl: (newUrl: string) => void;
  onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  baseUrl,
  sessionId,
  groupCount,
  onUpdateBaseUrl,
  onClose
}) => {
  const [urlInput, setUrlInput] = useState(baseUrl);
  const [copiedGroup, setCopiedGroup] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    let formatted = urlInput.trim();
    if (formatted.endsWith('/')) {
      formatted = formatted.slice(0, -1);
    }
    onUpdateBaseUrl(formatted);
    onClose();
  };

  const handleCopyGroupLink = async (groupId: number) => {
    const link = `${baseUrl}?group=${groupId}&session=${sessionId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedGroup(groupId);
      setTimeout(() => setCopiedGroup(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-2xl">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">
              CẤU HÌNH ĐỊA CHỈ & LIÊN KẾT
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Điều chỉnh địa chỉ Domain/IP phục vụ quét mã QR điện thoại
            </p>
          </div>
        </div>

        <div className="space-y-4 my-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Địa chỉ App/Domain cho Học sinh kết nối:
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com hoac http://192.168.1.5:3000"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              Tự động điền theo URL hiện tại hoặc nhập IP mạng nội bộ của giáo viên.
            </p>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Danh sách đường link trực tiếp các Nhóm:
            </h3>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {Array.from({ length: groupCount }, (_, i) => {
                const gId = i + 1;
                const link = `${baseUrl}?group=${gId}&session=${sessionId}`;

                return (
                  <div
                    key={gId}
                    className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <span className="font-bold text-blue-600 dark:text-blue-400 min-w-[70px]">
                      NHÓM {gId}
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-300 truncate mx-2 max-w-[220px]">
                      {link}
                    </span>
                    <button
                      onClick={() => handleCopyGroupLink(gId)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors flex items-center gap-1 shrink-0 cursor-pointer font-medium"
                    >
                      {copiedGroup === gId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Sao chép
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all text-sm cursor-pointer"
          >
            Lưu địa chỉ
          </button>
        </div>
      </div>
    </div>
  );
};

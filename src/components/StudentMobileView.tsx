import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Trash2,
  RotateCw,
  AlertOctagon,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle,
  Upload,
  ArrowLeft,
  Maximize,
  Minimize
} from 'lucide-react';
import { GroupData } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface StudentMobileViewProps {
  groupId: number;
  sessionParam: string;
  qrParam: string;
  currentSessionId: string;
  groupData: GroupData | undefined;
  isConnected: boolean;
  onUpdateGroupName: (groupId: number, name: string) => void;
  onUploadImage: (groupId: number, base64: string) => Promise<void>;
  onDeleteImage: (groupId: number, imageId: string) => void;
  onClearGroupImages: (groupId: number) => void;
  onRotateImage: (groupId: number, imageId: string) => void;
  onBackToTeacherView?: () => void;
}

export const StudentMobileView: React.FC<StudentMobileViewProps> = ({
  groupId,
  sessionParam,
  qrParam,
  currentSessionId,
  groupData,
  isConnected,
  onUpdateGroupName,
  onUploadImage,
  onDeleteImage,
  onClearGroupImages,
  onRotateImage,
  onBackToTeacherView
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null);
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsMobileFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
  };

  // Checks
  const isSessionMismatch = sessionParam && sessionParam !== currentSessionId;
  const isGroupDeleted = !groupData;
  const isQRExpired =
    groupData && qrParam && groupData.qrKey && qrParam !== groupData.qrKey;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (groupData && groupData.images.length >= 4) {
      setUploadError('Đã đạt tối đa 4 bài làm cho nhóm này!');
      return;
    }

    const file = files[0];
    setIsUploading(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          await onUploadImage(groupId, base64);
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        setUploadError('Không thể đọc file hình ảnh!');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadError('Lỗi tải ảnh!');
      setIsUploading(false);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Mobile Header */}
      <header className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-4 shadow-lg sticky top-0 z-30">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {onBackToTeacherView && (
              <button
                onClick={onBackToTeacherView}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors cursor-pointer mr-1"
                title="Quay lại giao diện giáo viên"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <span className="text-xs font-black tracking-wide text-blue-200 uppercase bg-blue-900/50 px-2 py-0.5 rounded-full border border-blue-400/30">
              TRƯỜNG TỂU HỌC QUÁN TOAN
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-1 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
              title={isMobileFullscreen ? 'Thu nhỏ màn hình' : 'Phóng to toàn màn hình'}
            >
              {isMobileFullscreen ? (
                <Minimize className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Maximize className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isMobileFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
              </span>
            </button>

            <div className="flex items-center gap-1.5 text-xs bg-black/20 px-2.5 py-1 rounded-full font-mono">
              {isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-200">Trực tuyến</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-300">Đang kết nối...</span>
                </>
              )}
            </div>
          </div>
        </div>

        <h1 className="text-xl font-black tracking-tight text-white flex items-center justify-between">
          <span>GIAO DIỆN HỌC SINH</span>
          <span className="text-amber-300 text-sm font-mono bg-amber-400/20 px-2 py-0.5 rounded-lg border border-amber-300/30">
            PHIÊN: {currentSessionId}
          </span>
        </h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        {/* Status Alerts */}
        {isSessionMismatch && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-500 rounded-2xl text-rose-800 dark:text-rose-200 space-y-2 shadow-md animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-base">
              <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0" />
              <span>PHIÊN LÀM VIỆC ĐÃ THAY ĐỔI</span>
            </div>
            <p className="text-xs leading-relaxed">
              Giáo viên đã tạo phiên làm việc mới. Vui lòng quét lại mã QR trên màn hình giáo viên!
            </p>
          </div>
        )}

        {isGroupDeleted && !isSessionMismatch && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-500 rounded-2xl text-rose-800 dark:text-rose-200 space-y-2 shadow-md animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-base">
              <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0" />
              <span>NHÓM ĐÃ BỊ XÓA</span>
            </div>
            <p className="text-xs leading-relaxed">
              Giáo viên đã điều chỉnh giảm số lượng nhóm. Nhóm này không còn tồn tại trên bảng chính.
            </p>
          </div>
        )}

        {isQRExpired && !isGroupDeleted && !isSessionMismatch && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-500 rounded-2xl text-amber-800 dark:text-amber-200 space-y-2 shadow-md animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-base">
              <RefreshCw className="w-6 h-6 text-amber-600 shrink-0 animate-spin" />
              <span>MÃ QR ĐÃ HẾT HẠN</span>
            </div>
            <p className="text-xs leading-relaxed">
              Mã QR cho nhóm này vừa được làm mới. Vui lòng quét lại mã QR mới trên màn hình giáo viên để cập nhật link kết nối!
            </p>
          </div>
        )}

        {/* Normal Active Group View */}
        {groupData && !isGroupDeleted && (
          <>
            {/* Editable Group Name Card */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Tên Nhóm Của Bạn:
              </label>
              <input
                type="text"
                value={groupData.name}
                onChange={(e) => onUpdateGroupName(groupId, e.target.value)}
                placeholder={`NHÓM ${groupId}`}
                className="w-full text-xl font-black px-4 py-2.5 rounded-xl border-2 border-blue-200 dark:border-blue-900 focus:border-blue-500 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none transition-all"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                💡 Tên nhóm sẽ tự động đồng bộ thời gian thực với màn hình giáo viên.
              </p>
            </div>

            {/* Upload Action Card */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                  Gửi Bài Làm Cho Nhóm ({groupData.images.length}/4)
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Tối đa 4 ảnh
                </span>
              </div>

              {uploadError && (
                <div className="p-2.5 bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl">
                  {uploadError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* Camera Button */}
                <button
                  disabled={groupData.images.length >= 4 || isUploading}
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-md flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-xs">Chụp ảnh bài làm</span>
                </button>

                {/* Library Upload Button */}
                <button
                  disabled={groupData.images.length >= 4 || isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-md flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs">Chọn từ thư viện</span>
                </button>
              </div>

              {/* Hidden File Inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {isUploading && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-300 flex items-center justify-center gap-2 animate-pulse">
                  <Upload className="w-4 h-4 animate-bounce" />
                  <span>Đang tải bài làm lên server...</span>
                </div>
              )}
            </div>

            {/* List of Uploaded Images */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">
                  Bài Làm Đã Tải Lên
                </h3>

                {groupData.images.length > 0 && (
                  <button
                    onClick={() => setConfirmClearOpen(true)}
                    className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa tất cả ảnh
                  </button>
                )}
              </div>

              {groupData.images.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    Chưa có bài làm nào. Hãy chụp hoặc chọn ảnh để gửi lên bảng nhóm!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {groupData.images.map((img, idx) => (
                    <div
                      key={img.id}
                      className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center relative group"
                    >
                      <div className="w-full h-32 bg-black/10 rounded-lg overflow-hidden flex items-center justify-center relative">
                        <img
                          src={img.url}
                          alt={`Bài làm ${idx + 1}`}
                          className="max-w-full max-h-full object-contain transition-transform duration-200"
                          style={{ transform: `rotate(${img.rotation}deg)` }}
                        />
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-between w-full mt-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => onRotateImage(groupId, img.id)}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          title="Xoay 90°"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>{img.rotation}°</span>
                        </button>

                        <button
                          onClick={() => setDeleteImageId(img.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer transition-colors"
                          title="Xóa bài làm này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={confirmClearOpen}
        title="Xóa tất cả bài làm?"
        message="Bạn có chắc chắn muốn xóa toàn bộ hình ảnh bài làm đã tải lên của nhóm này không?"
        confirmText="Xóa tất cả"
        cancelText="Giữ lại"
        variant="danger"
        onConfirm={() => {
          onClearGroupImages(groupId);
          setConfirmClearOpen(false);
        }}
        onCancel={() => setConfirmClearOpen(false)}
      />

      <ConfirmModal
        isOpen={deleteImageId !== null}
        title="Xóa bài làm này?"
        message="Bạn có chắc chắn muốn xóa hình ảnh bài làm này khỏi nhóm không?"
        confirmText="Xóa bài làm"
        cancelText="Hủy"
        variant="danger"
        onConfirm={() => {
          if (deleteImageId) {
            onDeleteImage(groupId, deleteImageId);
            setDeleteImageId(null);
          }
        }}
        onCancel={() => setDeleteImageId(null)}
      />
    </div>
  );
};

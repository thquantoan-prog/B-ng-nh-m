import React, { useRef, useState, useEffect } from 'react';
import {
  Minimize2,
  QrCode,
  RotateCw,
  Trash2,
  Upload,
  Maximize2,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { GroupData, ImageItem } from '../types';
import { StarRating } from './StarRating';
import { ConfirmModal } from './ConfirmModal';

interface GroupFullScreenViewProps {
  group: GroupData;
  onClose: () => void;
  onOpenQR: (group: GroupData) => void;
  onUpdateGroupName: (groupId: number, name: string) => void;
  onClearGroupImages: (groupId: number) => void;
  onUploadImage: (groupId: number, base64: string) => Promise<void>;
  onDeleteImage: (groupId: number, imageId: string) => void;
  onRotateImage: (groupId: number, imageId: string) => void;
  onSetStars: (groupId: number, stars: number) => void;
  onImageClick: (group: GroupData, image: ImageItem) => void;
}

export const GroupFullScreenView: React.FC<GroupFullScreenViewProps> = ({
  group,
  onClose,
  onOpenQR,
  onUpdateGroupName,
  onClearGroupImages,
  onUploadImage,
  onDeleteImage,
  onRotateImage,
  onSetStars,
  onImageClick
}) => {
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for ESC key specifically for closing this full screen view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmClearOpen) {
          setConfirmClearOpen(false);
        } else if (deleteImageId) {
          setDeleteImageId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, confirmClearOpen, deleteImageId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (group.images.length >= 4) {
      alert('Mỗi nhóm tối đa 4 hình ảnh!');
      return;
    }

    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        await onUploadImage(group.id, base64);
      }
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = '';
  };

  const imgCount = group.images.length;

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 text-white flex flex-col animate-fadeIn select-none overflow-hidden">
      {/* Top Header */}
      <header className="px-6 py-3.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between z-10 shrink-0 shadow-lg backdrop-blur-md">
        {/* Left: Group QR Button & Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenQR(group)}
            className="px-3.5 py-2 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
            title="Mở mã QR cho học sinh quét bài làm"
          >
            <QrCode className="w-4 h-4" />
            <span>MÃ QR NHÓM</span>
          </button>

          <span className="text-xs text-slate-400 hidden sm:inline-flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
            <span>Đã nộp: {imgCount}/4 bài làm</span>
          </span>
        </div>

        {/* Center: Large Editable Group Name */}
        <div className="flex-1 max-w-md mx-4 text-center">
          <input
            type="text"
            value={group.name}
            onChange={(e) => onUpdateGroupName(group.id, e.target.value)}
            placeholder={`NHÓM ${group.id}`}
            className="w-full text-center font-black text-xl md:text-2xl text-amber-300 bg-transparent border-b-2 border-transparent hover:border-amber-400 focus:border-amber-400 focus:bg-slate-800/70 focus:outline-none rounded-lg px-3 py-1 transition-all uppercase tracking-wider"
          />
        </div>

        {/* Right: Actions and Exit Minimize Button */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Clear / Reset group button */}
          <button
            onClick={() => setConfirmClearOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer border border-transparent hover:border-rose-800/50"
            title="Xóa tất cả bài làm của nhóm này"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          {/* Minimize / Exit Full Screen Button */}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs md:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer ring-2 ring-amber-400/50"
            title="Thu nhỏ về giao diện tổng quan các nhóm (Phím ESC)"
          >
            <Minimize2 className="w-4 h-4 text-slate-950 font-black" />
            <span>THU NHỎ (ESC)</span>
          </button>
        </div>
      </header>

      {/* Main Image Stage - 100% Full Viewport */}
      <main className="flex-1 p-4 md:p-6 overflow-hidden flex items-center justify-center relative bg-slate-950/60">
        {imgCount === 0 ? (
          /* Empty State Dropzone */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-2xl h-[65vh] border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-3xl flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 hover:bg-slate-900/80 transition-all cursor-pointer group"
          >
            <div className="w-20 h-20 rounded-3xl bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-100 mb-1">
              Chưa có bài làm nào cho {group.name}
            </h3>
            <p className="text-sm text-slate-400 max-w-md">
              Học sinh hãy quét mã QR nhóm bằng điện thoại hoặc bấm vào đây để tải ảnh bài làm lên màn hình lớn.
            </p>
          </div>
        ) : (
          /* High Resolution Images Grid Layout */
          <div
            className={`w-full h-full grid gap-4 ${
              imgCount === 1
                ? 'grid-cols-1 grid-rows-1 max-w-6xl'
                : imgCount === 2
                ? 'grid-cols-1 md:grid-cols-2 grid-rows-1'
                : 'grid-cols-1 md:grid-cols-2 grid-rows-2'
            }`}
          >
            {group.images.map((img, idx) => (
              <div
                key={img.id}
                onClick={() => onImageClick(group, img)}
                className="relative rounded-2xl overflow-hidden bg-slate-900/90 border-2 border-slate-800 hover:border-blue-500 flex items-center justify-center transition-all cursor-pointer group shadow-2xl"
              >
                {/* Image Label Tag */}
                <div className="absolute top-3 left-3 z-20 bg-black/70 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-slate-200 border border-white/10 flex items-center gap-1.5 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>Bài làm {idx + 1}</span>
                </div>

                {/* Inspect Zoom prompt */}
                <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white p-2 rounded-xl backdrop-blur-md flex items-center gap-1 text-xs font-semibold">
                  <Maximize2 className="w-4 h-4" />
                  <span>Soi chi tiết</span>
                </div>

                {/* High-res Image */}
                <img
                  src={img.url}
                  alt={`Bài làm ${idx + 1}`}
                  className="max-w-full max-h-full object-contain pointer-events-none transition-transform duration-200"
                  style={{ transform: `rotate(${img.rotation}deg)` }}
                />

                {/* Bottom-left: Rotate Action */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRotateImage(group.id, img.id);
                  }}
                  className="absolute bottom-3 left-3 z-20 px-3 py-1.5 bg-black/80 hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-all cursor-pointer border border-white/10"
                  title="Xoay ảnh 90 độ"
                >
                  <RotateCw className="w-3.5 h-3.5 text-amber-300" />
                  <span>Xoay ({img.rotation}°)</span>
                </button>

                {/* Bottom-right: Delete Single Image */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteImageId(img.id);
                  }}
                  className="absolute bottom-3 right-3 z-20 p-2 bg-black/80 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl text-xs font-bold backdrop-blur-md shadow-lg transition-all cursor-pointer border border-white/10 opacity-0 group-hover:opacity-100"
                  title="Xóa bài làm này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Control Bar */}
      <footer className="px-6 py-3 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between z-10 shrink-0 shadow-lg backdrop-blur-md">
        {/* Left: Upload Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={group.images.length >= 4}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-extrabold rounded-xl text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
            title="Tải thêm bài làm cho nhóm"
          >
            <Upload className="w-4 h-4" />
            <span>TẢI BÀI LÀM</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Center: Hint */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Bấm vào ảnh để soi chi tiết hoặc bấm ngôi sao để chấm điểm pháo hoa</span>
        </div>

        {/* Right: Star Rating Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wide">
            ĐÁNH GIÁ:
          </span>
          <StarRating
            groupId={group.id}
            stars={group.stars}
            onSetStars={onSetStars}
          />
        </div>
      </footer>

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={confirmClearOpen}
        title={`Xóa tất cả bài làm của ${group.name}?`}
        message={`Bạn có chắc chắn muốn xóa toàn bộ hình ảnh và điểm số của ${group.name} không? Hành động này không thể hoàn tác.`}
        confirmText="Xóa toàn bộ"
        cancelText="Hủy"
        variant="danger"
        onConfirm={() => {
          onClearGroupImages(group.id);
          setConfirmClearOpen(false);
        }}
        onCancel={() => setConfirmClearOpen(false)}
      />

      <ConfirmModal
        isOpen={deleteImageId !== null}
        title="Xóa bài làm này?"
        message="Bạn có chắc chắn muốn xóa hình ảnh bài làm đã chọn này không?"
        confirmText="Xóa ảnh"
        cancelText="Hủy"
        variant="danger"
        onConfirm={() => {
          if (deleteImageId) {
            onDeleteImage(group.id, deleteImageId);
            setDeleteImageId(null);
          }
        }}
        onCancel={() => setDeleteImageId(null)}
      />
    </div>
  );
};

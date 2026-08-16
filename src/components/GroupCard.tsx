import React, { useRef, useState } from 'react';
import {
  QrCode,
  RotateCw,
  Trash2,
  Upload,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import { GroupData, ImageItem } from '../types';
import { StarRating } from './StarRating';
import { ConfirmModal } from './ConfirmModal';
import { SelectedCompareItem } from './CompareModal';

interface GroupCardProps {
  group: GroupData;
  isCompareMode: boolean;
  selectedCompareItems: SelectedCompareItem[];
  onOpenQR: (group: GroupData) => void;
  onUpdateGroupName: (groupId: number, name: string) => void;
  onClearGroupImages: (groupId: number) => void;
  onUploadImage: (groupId: number, base64: string) => Promise<void>;
  onRotateImage: (groupId: number, imageId: string) => void;
  onSetStars: (groupId: number, stars: number) => void;
  onToggleCompareSelect: (item: SelectedCompareItem) => void;
  onImageClick: (group: GroupData, image: ImageItem) => void;
  onToggleMaximizeGroup?: (groupId: number) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  isCompareMode,
  selectedCompareItems,
  onOpenQR,
  onUpdateGroupName,
  onClearGroupImages,
  onUploadImage,
  onRotateImage,
  onSetStars,
  onToggleCompareSelect,
  onImageClick,
  onToggleMaximizeGroup
}) => {
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Grid sizing logic
  const imgCount = group.images.length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden transition-all duration-200 hover:shadow-xl">
      {/* Group Card Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
        {/* Left: QR Code Button */}
        <button
          onClick={() => onOpenQR(group)}
          className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          title="Mở popup Mã QR cho học sinh quét"
        >
          <QrCode className="w-4 h-4" />
          <span className="hidden sm:inline">MÃ QR</span>
        </button>

        {/* Center: Editable Group Name */}
        <div className="flex-1 mx-3 text-center">
          <input
            type="text"
            value={group.name}
            onChange={(e) => onUpdateGroupName(group.id, e.target.value)}
            placeholder={`NHÓM ${group.id}`}
            className="w-full text-center font-black text-slate-800 dark:text-slate-100 text-base md:text-lg bg-transparent border-b-2 border-transparent hover:border-blue-400 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none rounded px-2 py-0.5 transition-all uppercase tracking-wide"
          />
        </div>

        {/* Right: Maximize & Reset Group Buttons */}
        <div className="flex items-center gap-1">
          {onToggleMaximizeGroup && (
            <button
              onClick={() => onToggleMaximizeGroup(group.id)}
              className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-100 dark:text-slate-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
              title="Phóng to toàn màn hình nhóm này"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setConfirmClearOpen(true)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            title="Xóa tất cả bài làm của nhóm này"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Image Area - Co-dãn linh hoạt */}
      <div className="flex-1 p-2 bg-slate-100/50 dark:bg-slate-950/40 min-h-[180px] flex items-center justify-center overflow-hidden relative">
        {imgCount === 0 ? (
          /* Empty State Dropzone */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center p-4 text-center hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Chưa có bài làm
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Học sinh quét mã QR hoặc bấm TẢI để gửi bài
            </p>
          </div>
        ) : (
          /* Images Grid Layout */
          <div
            className={`w-full h-full grid gap-2 ${
              imgCount === 1 ? 'grid-cols-1 grid-rows-1' : 'grid-cols-2 grid-rows-2'
            }`}
          >
            {group.images.map((img) => {
              // Check if selected for compare mode
              const compareIdx = selectedCompareItems.findIndex(
                (item) => item.groupId === group.id && item.image.id === img.id
              );
              const isSelectedCompare = compareIdx !== -1;

              return (
                <div
                  key={img.id}
                  onClick={() => {
                    if (isCompareMode) {
                      onToggleCompareSelect({
                        groupId: group.id,
                        groupName: group.name,
                        image: img
                      });
                    } else {
                      onImageClick(group, img);
                    }
                  }}
                  className={`relative rounded-xl overflow-hidden bg-slate-900 border-2 transition-all cursor-pointer group/img flex items-center justify-center ${
                    isSelectedCompare
                      ? 'border-amber-400 ring-4 ring-amber-400/30 shadow-lg scale-[0.98]'
                      : isCompareMode
                      ? 'border-blue-400/50 hover:border-blue-500 hover:scale-[1.01]'
                      : 'border-slate-200 dark:border-slate-800 hover:border-blue-400'
                  }`}
                >
                  {/* Image Display */}
                  <img
                    src={img.url}
                    alt="Bài làm học sinh"
                    className="max-w-full max-h-full object-contain transition-transform duration-200 pointer-events-none"
                    style={{ transform: `rotate(${img.rotation}deg)` }}
                  />

                  {/* Compare Badge Tag */}
                  {isSelectedCompare && (
                    <div className="absolute top-2 left-2 z-10 bg-amber-400 text-slate-900 font-black text-xs px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>SỐ {compareIdx + 1}</span>
                    </div>
                  )}

                  {/* Hover Zoom Prompt Badge */}
                  {!isCompareMode && (
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/60 text-white p-1 rounded-lg backdrop-blur-xs">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Rotate Button (Góc dưới bên trái) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // prevent opening zoom/compare modal
                      onRotateImage(group.id, img.id);
                    }}
                    className="absolute bottom-2 left-2 z-20 px-2 py-1 bg-black/70 hover:bg-blue-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 backdrop-blur-md shadow-md transition-all cursor-pointer"
                    title="Xoay ảnh 90 độ"
                  >
                    <RotateCw className="w-3 h-3 text-amber-300" />
                    <span>{img.rotation}°</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Group Card Bottom Toolbar */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        {/* Upload Button (Góc dưới bên trái) */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={group.images.length >= 4}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          title="Tải bài làm lên nhóm"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>TẢI</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* 10-Star Rating Bar & Fireworks */}
        <div className="flex-1 flex justify-end">
          <StarRating
            groupId={group.id}
            stars={group.stars}
            onSetStars={onSetStars}
          />
        </div>
      </div>

      {/* Confirm Clear Modal */}
      <ConfirmModal
        isOpen={confirmClearOpen}
        title={`Xóa bài làm ${group.name}?`}
        message={`Bạn có chắc chắn muốn xóa toàn bộ hình ảnh và điểm số của ${group.name} không? Các nhóm khác sẽ không bị ảnh hưởng.`}
        confirmText="Xóa nhóm này"
        cancelText="Hủy"
        variant="danger"
        onConfirm={() => {
          onClearGroupImages(group.id);
          setConfirmClearOpen(false);
        }}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </div>
  );
};

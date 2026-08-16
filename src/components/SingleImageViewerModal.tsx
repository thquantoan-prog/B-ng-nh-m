import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Move
} from 'lucide-react';
import { ImageItem } from '../types';

interface SingleImageViewerModalProps {
  isOpen: boolean;
  groupId: number;
  groupName: string;
  image: ImageItem | null;
  onRotateImage: (groupId: number, imageId: string) => void;
  onClose: () => void;
}

export const SingleImageViewerModal: React.FC<SingleImageViewerModalProps> = ({
  isOpen,
  groupId,
  groupName,
  image,
  onRotateImage,
  onClose
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Reset zoom & pan when modal opens or image changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, image?.id]);

  if (!isOpen || !image) return null;

  const handleZoomIn = () => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(0.5, +(z - 0.25).toFixed(2));
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Dragging / Panning handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch panning
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.touches[0].clientX - pan.x,
      y: e.touches[0].clientY - pan.y
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.current.x,
      y: e.touches[0].clientY - dragStart.current.y
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 text-white select-none animate-fadeIn overflow-hidden"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800 z-10">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold uppercase">
            {groupName}
          </span>
          <h2 className="text-lg font-bold text-slate-100">Xem Chi Tiết Bài Làm</h2>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            title="Thu nhỏ (-)"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          {/* Zoom % badge */}
          <button
            onClick={handleResetZoom}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-extrabold text-blue-400 font-mono transition-colors cursor-pointer"
            title="Đặt lại 100%"
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            title="Phóng to (+)"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-slate-800 mx-1" />

          {/* Rotate Button */}
          <button
            onClick={() => onRotateImage(groupId, image.id)}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md"
            title="Xoay ảnh 90 độ"
          >
            <RotateCw className="w-4 h-4" />
            <span>Xoay ({image.rotation}°)</span>
          </button>

          <div className="w-px h-6 bg-slate-800 mx-1" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-colors cursor-pointer"
            title="Đóng (X)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className={`flex-1 relative flex items-center justify-center overflow-hidden p-6 ${
          zoom > 1
            ? isDragging
              ? 'cursor-grabbing'
              : 'cursor-grab'
            : 'cursor-default'
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Panning Instruction Notice when zoomed */}
        {zoom > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-slate-900/90 border border-slate-700 rounded-full text-xs text-amber-300 font-medium flex items-center gap-2 shadow-lg backdrop-blur-md pointer-events-none animate-pulse">
            <Move className="w-4 h-4" />
            <span>Giữ chuột và kéo để di chuyển ảnh | Cuộn chuột để phóng to/thu nhỏ</span>
          </div>
        )}

        <div
          className="transition-transform duration-75 ease-out flex items-center justify-center max-w-full max-h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${image.rotation}deg)`
          }}
        >
          <img
            src={image.url}
            alt="Bài làm phóng to"
            className="max-w-[85vw] max-h-[80vh] object-contain rounded-lg shadow-2xl pointer-events-none select-none"
          />
        </div>
      </div>
    </div>
  );
};

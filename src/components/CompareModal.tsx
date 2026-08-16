import React, { useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Columns2, Move } from 'lucide-react';
import { ImageItem } from '../types';

export interface SelectedCompareItem {
  groupId: number;
  groupName: string;
  image: ImageItem;
}

interface CompareModalProps {
  isOpen: boolean;
  selectedItems: SelectedCompareItem[];
  onRotateImage: (groupId: number, imageId: string) => void;
  onRemoveItem: (index: number) => void;
  onClose: () => void;
}

interface ImageState {
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  selectedItems,
  onRotateImage,
  onRemoveItem,
  onClose
}) => {
  // Independent zoom and pan state for the 2 items
  const [states, setStates] = useState<ImageState[]>([
    { zoom: 1, pan: { x: 0, y: 0 }, isDragging: false },
    { zoom: 1, pan: { x: 0, y: 0 }, isDragging: false }
  ]);

  const dragStarts = useRef<{ x: number; y: number }[]>([
    { x: 0, y: 0 },
    { x: 0, y: 0 }
  ]);

  if (!isOpen || selectedItems.length < 2) return null;

  const handleZoom = (index: number, delta: number) => {
    setStates((prev) => {
      const copy = [...prev];
      const cur = copy[index] || { zoom: 1, pan: { x: 0, y: 0 }, isDragging: false };
      const nextZoom = Math.min(4, Math.max(0.5, +(cur.zoom + delta).toFixed(2)));
      copy[index] = {
        ...cur,
        zoom: nextZoom,
        pan: nextZoom <= 1 ? { x: 0, y: 0 } : cur.pan
      };
      return copy;
    });
  };

  const handleResetZoom = (index: number) => {
    setStates((prev) => {
      const copy = [...prev];
      copy[index] = { zoom: 1, pan: { x: 0, y: 0 }, isDragging: false };
      return copy;
    });
  };

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    const st = states[index];
    if (!st || st.zoom <= 1) return;
    dragStarts.current[index] = {
      x: e.clientX - st.pan.x,
      y: e.clientY - st.pan.y
    };
    setStates((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], isDragging: true };
      return copy;
    });
  };

  const handleMouseMove = (index: number, e: React.MouseEvent) => {
    const st = states[index];
    if (!st || !st.isDragging) return;
    const newPan = {
      x: e.clientX - dragStarts.current[index].x,
      y: e.clientY - dragStarts.current[index].y
    };
    setStates((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], pan: newPan };
      return copy;
    });
  };

  const handleMouseUp = (index: number) => {
    setStates((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], isDragging: false };
      }
      return copy;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/98 text-white select-none animate-fadeIn overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 border-b border-slate-800 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
            <Columns2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">CHẾ ĐỘ SO SÁNH SONG SONG</h2>
            <p className="text-xs text-slate-400">
              Đối chiếu trực tiếp 2 bài làm giữa các nhóm
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer text-sm"
        >
          <X className="w-5 h-5" />
          Thoát So Sánh
        </button>
      </div>

      {/* Main Split Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden relative">
        {selectedItems.slice(0, 2).map((item, idx) => {
          const st = states[idx] || { zoom: 1, pan: { x: 0, y: 0 }, isDragging: false };

          return (
            <div
              key={`${item.groupId}-${item.image.id}-${idx}`}
              className="flex flex-col h-full relative overflow-hidden bg-slate-900/40"
              onMouseUp={() => handleMouseUp(idx)}
              onMouseLeave={() => handleMouseUp(idx)}
            >
              {/* Individual Image Toolbar */}
              <div className="flex items-center justify-between p-3 bg-slate-900/80 border-b border-slate-800/80 z-10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold uppercase">
                    {item.groupName}
                  </span>
                  <span className="text-xs text-slate-400">Bài làm {idx + 1}</span>
                </div>

                {/* Independent Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleZoom(idx, -0.25)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                    title="Thu nhỏ"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleResetZoom(idx)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-blue-400 transition-colors cursor-pointer"
                  >
                    {Math.round(st.zoom * 100)}%
                  </button>

                  <button
                    onClick={() => handleZoom(idx, 0.25)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                    title="Phóng to"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <div className="w-px h-5 bg-slate-800 mx-1" />

                  {/* Rotate */}
                  <button
                    onClick={() => onRotateImage(item.groupId, item.image.id)}
                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold px-2"
                    title="Xoay 90°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{item.image.rotation}°</span>
                  </button>

                  {/* Independent Close X */}
                  <button
                    onClick={() => onRemoveItem(idx)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
                    title="Bỏ bài làm này khỏi so sánh"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Image Viewport */}
              <div
                className={`flex-1 flex items-center justify-center p-4 relative overflow-hidden ${
                  st.zoom > 1
                    ? st.isDragging
                      ? 'cursor-grabbing'
                      : 'cursor-grab'
                    : 'cursor-default'
                }`}
                onMouseDown={(e) => handleMouseDown(idx, e)}
                onMouseMove={(e) => handleMouseMove(idx, e)}
              >
                {st.zoom > 1 && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-slate-900/90 border border-slate-700 rounded-full text-[11px] text-amber-300 font-medium flex items-center gap-1.5 shadow-md pointer-events-none">
                    <Move className="w-3 h-3" />
                    <span>Kéo để di chuyển</span>
                  </div>
                )}

                <div
                  className="transition-transform duration-75 ease-out flex items-center justify-center max-w-full max-h-full"
                  style={{
                    transform: `translate(${st.pan.x}px, ${st.pan.y}px) scale(${st.zoom}) rotate(${item.image.rotation}deg)`
                  }}
                >
                  <img
                    src={item.image.url}
                    alt={`So sánh ${item.groupName}`}
                    className="max-w-[42vw] max-h-[75vh] object-contain rounded-lg shadow-xl pointer-events-none select-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

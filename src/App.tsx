import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  Minus,
  Plus,
  Columns2,
  Globe,
  Smartphone,
  Wifi,
  WifiOff,
  AlertCircle,
  X,
  Maximize,
  Minimize,
  Maximize2
} from 'lucide-react';
import { SessionState, GroupData, ImageItem } from './types';
import { GroupCard } from './components/GroupCard';
import { QRCodeModal } from './components/QRCodeModal';
import { SingleImageViewerModal } from './components/SingleImageViewerModal';
import { CompareModal, SelectedCompareItem } from './components/CompareModal';
import { ConfigModal } from './components/ConfigModal';
import { ConfirmModal } from './components/ConfirmModal';
import { StudentMobileView } from './components/StudentMobileView';
import { GroupFullScreenView } from './components/GroupFullScreenView';

export default function App() {
  // Check URL query parameters to see if opened as student mobile
  const urlParams = new URLSearchParams(window.location.search);
  const groupParam = urlParams.get('group');
  const sessionParam = urlParams.get('session') || '';
  const qrParam = urlParams.get('qr') || '';

  const [simulatedMobileGroup, setSimulatedMobileGroup] = useState<number | null>(
    groupParam ? parseInt(groupParam, 10) : null
  );

  // App State
  const [state, setState] = useState<SessionState>({
    sessionId: 'QT882A',
    groupCount: 2,
    groups: [
      { id: 1, name: 'NHÓM 1', images: [], stars: 0, qrKey: 'qr-1' },
      { id: 2, name: 'NHÓM 2', images: [], stars: 0, qrKey: 'qr-2' }
    ],
    lastUpdated: Date.now()
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isAppFullscreen, setIsAppFullscreen] = useState(false);
  const [focusedGroupId, setFocusedGroupId] = useState<number | null>(null);

  const [baseUrl, setBaseUrl] = useState(() => {
    return window.location.origin + window.location.pathname;
  });

  // Modal States
  const [activeQRGroup, setActiveQRGroup] = useState<GroupData | null>(null);
  const [singleViewImage, setSingleViewImage] = useState<{
    groupId: number;
    groupName: string;
    image: ImageItem;
  } | null>(null);

  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedCompareItems, setSelectedCompareItems] = useState<
    SelectedCompareItem[]
  >([]);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isResetAllConfirmOpen, setIsResetAllConfirmOpen] = useState(false);

  // WebSocket Ref
  const wsRef = useRef<WebSocket | null>(null);

  // 1. Fetch initial state and establish WebSocket connection
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('/api/state');
        const data = await res.json();
        if (data.success && data.state) {
          setState(data.state);
        }
      } catch (err) {
        console.error('Error fetching state:', err);
      }
    };

    fetchState();

    // Setup WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const connectWS = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'INIT' || data.type === 'STATE_UPDATE') {
              if (data.state) {
                setState(data.state);
              }
            }
          } catch (e) {
            console.error('WS parse error:', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Reconnect after 3s
          setTimeout(connectWS, 3000);
        };

        ws.onerror = (err) => {
          console.error('WS error:', err);
          ws.close();
        };
      } catch (e) {
        console.error('WS connection failed:', e);
      }
    };

    connectWS();

    // Backup HTTP polling every 4s
    const pollInterval = setInterval(fetchState, 4000);

    return () => {
      clearInterval(pollInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Update active QR group state if server state updates
  useEffect(() => {
    if (activeQRGroup) {
      const updated = state.groups.find((g) => g.id === activeQRGroup.id);
      if (updated) {
        setActiveQRGroup(updated);
      }
    }
  }, [state]);

  // Update single view image if image or rotation changes
  useEffect(() => {
    if (singleViewImage) {
      const group = state.groups.find((g) => g.id === singleViewImage.groupId);
      if (group) {
        const img = group.images.find((i) => i.id === singleViewImage.image.id);
        if (img) {
          setSingleViewImage({
            groupId: group.id,
            groupName: group.name,
            image: img
          });
        }
      }
    }
  }, [state]);

  // Sync selected compare items with state changes
  useEffect(() => {
    if (selectedCompareItems.length > 0) {
      const updatedList: SelectedCompareItem[] = [];
      selectedCompareItems.forEach((item) => {
        const group = state.groups.find((g) => g.id === item.groupId);
        if (group) {
          const img = group.images.find((i) => i.id === item.image.id);
          if (img) {
            updatedList.push({
              groupId: group.id,
              groupName: group.name,
              image: img
            });
          }
        }
      });
      setSelectedCompareItems(updatedList);
    }
  }, [state]);

  // Fullscreen state listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsAppFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Global ESC shortcut handler with logical precedence
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (singleViewImage) {
          setSingleViewImage(null);
        } else if (activeQRGroup) {
          setActiveQRGroup(null);
        } else if (selectedCompareItems.length >= 2) {
          setSelectedCompareItems([]);
          setIsCompareMode(false);
        } else if (isConfigOpen) {
          setIsConfigOpen(false);
        } else if (isResetAllConfirmOpen) {
          setIsResetAllConfirmOpen(false);
        } else if (focusedGroupId !== null) {
          setFocusedGroupId(null);
        } else if (isCompareMode) {
          setIsCompareMode(false);
          setSelectedCompareItems([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    singleViewImage,
    activeQRGroup,
    selectedCompareItems.length,
    isConfigOpen,
    isResetAllConfirmOpen,
    focusedGroupId,
    isCompareMode
  ]);

  const toggleAppFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  // API Mutators
  const handleResetAll = async () => {
    try {
      const res = await fetch('/api/reset-all', { method: 'POST' });
      const data = await res.json();
      if (data.state) setState(data.state);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateGroupCount = async (newCount: number) => {
    if (newCount < 2 || newCount > 6) return;
    try {
      const res = await fetch('/api/update-group-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupCount: newCount })
      });
      const data = await res.json();
      if (data.state) setState(data.state);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateGroupName = async (groupId: number, name: string) => {
    try {
      const res = await fetch('/api/update-group-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, name })
      });
      const data = await res.json();
      if (data.state) setState(data.state);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadImage = async (groupId: number, base64: string) => {
    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, url: base64 })
      });
      const data = await res.json();
      if (data.state) setState(data.state);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteImage = async (groupId: number, imageId: string) => {
    try {
      const res = await fetch('/api/delete-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, imageId })
      });
      const data = await res.json();
      if (data.state) setState(data.state);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearGroupImages = async (groupId: number) => {
    try {
      const res = await fetch('/api/clear-group-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId })
      });
      const data = await res.json();
      if (data.state) setState(data.state);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRotateImage = async (groupId: number, imageId: string) => {
    try {
      const res = await fetch('/api/rotate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, imageId })
      });
      const data = await res.json();
      if (data.state) setState(data.state);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetStars = async (groupId: number, stars: number) => {
    try {
      const res = await fetch('/api/set-stars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, stars })
      });
      const data = await res.json();
      if (data.state) setState(data.state);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetGroupQR = async (groupId: number) => {
    try {
      const res = await fetch('/api/reset-group-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId })
      });
      const data = await res.json();
      if (data.state) setState(data.state);
    } catch (e) {
      console.error(e);
    }
  };

  // Compare Mode Toggling
  const handleToggleCompareSelect = (item: SelectedCompareItem) => {
    setSelectedCompareItems((prev) => {
      const existsIdx = prev.findIndex(
        (i) => i.groupId === item.groupId && i.image.id === item.image.id
      );
      if (existsIdx !== -1) {
        // Deselect
        return prev.filter((_, idx) => idx !== existsIdx);
      } else {
        if (prev.length >= 2) {
          // Replace second or add
          return [prev[1], item];
        }
        return [...prev, item];
      }
    });
  };

  const handleRemoveCompareItem = (index: number) => {
    setSelectedCompareItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Render Student Mobile View if URL has group param or simulated
  if (simulatedMobileGroup !== null) {
    const studentGroupData = state.groups.find((g) => g.id === simulatedMobileGroup);

    return (
      <StudentMobileView
        groupId={simulatedMobileGroup}
        sessionParam={sessionParam}
        qrParam={qrParam}
        currentSessionId={state.sessionId}
        groupData={studentGroupData}
        isConnected={isConnected}
        onUpdateGroupName={handleUpdateGroupName}
        onUploadImage={handleUploadImage}
        onDeleteImage={handleDeleteImage}
        onClearGroupImages={handleClearGroupImages}
        onRotateImage={handleRotateImage}
        onBackToTeacherView={() => setSimulatedMobileGroup(null)}
      />
    );
  }

  // Grid column CSS calculation for Viewport Fit (h-screen)
  const getGridColsClass = () => {
    switch (state.groupCount) {
      case 2:
        return 'grid-cols-1 md:grid-cols-2 grid-rows-1';
      case 3:
      case 4:
        return 'grid-cols-1 md:grid-cols-2 grid-rows-2';
      case 5:
      case 6:
        return 'grid-cols-1 md:grid-cols-3 grid-rows-2';
      default:
        return 'grid-cols-1 md:grid-cols-2';
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      {/* HEADER SECTION */}
      <header className="bg-gradient-to-r from-blue-800 via-indigo-900 to-blue-900 text-white px-6 py-2.5 shadow-xl shrink-0 z-20 border-b border-blue-700/50">
        <div className="flex items-center justify-between">
          {/* Left spacer / quick actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsConfigOpen(true)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-blue-100 border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Mở cấu hình Địa chỉ Domain / IP"
            >
              <Globe className="w-3.5 h-3.5 text-blue-300" />
              <span>Cấu Hình IP</span>
            </button>

            <button
              onClick={() => setSimulatedMobileGroup(1)}
              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Thử nghiệm Giao diện Điện thoại Học sinh"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Thử Giao Diện Học Sinh</span>
            </button>
          </div>

          {/* Center Title & Subtitle */}
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-black tracking-wider uppercase text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              BẢNG NHÓM
            </h1>
            <p className="text-xs md:text-sm font-medium text-slate-200 tracking-wide mt-0.5">
              Trường Tiểu học Quán Toan – P. Hồng An – TP Hải Phòng
            </p>
          </div>

          {/* Right: Real-time Status Badge & Session ID */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-xs font-mono">
              {isConnected ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 font-bold">Trực tuyến</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-300 font-bold">Mất kết nối...</span>
                </>
              )}
            </div>

            <div className="bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-xl text-xs tracking-wider uppercase shadow-md border border-amber-300">
              MÃ PHIÊN: {state.sessionId}
            </div>
          </div>
        </div>
      </header>

      {/* TOP TOOLBAR SECTION */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2 shadow-sm shrink-0 z-10">
        <div className="flex items-center justify-between">
          {/* Top Left Controls: RESET & SỐ NHÓM */}
          <div className="flex items-center gap-3">
            {/* RESET BUTTON */}
            <button
              onClick={() => setIsResetAllConfirmOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 text-xs md:text-sm cursor-pointer"
              title="Đặt lại toàn bộ bảng về trạng thái ban đầu"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESET TẤT CẢ</span>
            </button>

            {/* SỐ NHÓM CONTROLLER (- / +) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-inner">
              <button
                disabled={state.groupCount <= 2}
                onClick={() => handleUpdateGroupCount(state.groupCount - 1)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 dark:text-slate-100 transition-colors cursor-pointer shadow-xs"
                title="Giảm 1 nhóm (Tối thiểu 2 nhóm)"
              >
                <Minus className="w-4 h-4 font-black" />
              </button>

              <span className="px-3 text-xs md:text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                SỐ NHÓM: {state.groupCount}
              </span>

              <button
                disabled={state.groupCount >= 6}
                onClick={() => handleUpdateGroupCount(state.groupCount + 1)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 dark:text-slate-100 transition-colors cursor-pointer shadow-xs"
                title="Tăng 1 nhóm (Tối đa 6 nhóm)"
              >
                <Plus className="w-4 h-4 font-black" />
              </button>
            </div>
          </div>

          {/* Top Right Controls: TOÀN MÀN HÌNH & SO SÁNH */}
          <div className="flex items-center gap-3">
            {isCompareMode && (
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 animate-pulse">
                Đã chọn {selectedCompareItems.length}/2 bài làm. Hãy chọn bài để
                so sánh!
              </span>
            )}

            {/* App-wide Full Screen Button */}
            <button
              onClick={toggleAppFullscreen}
              className={`px-4 py-2 font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 text-xs md:text-sm cursor-pointer ${
                isAppFullscreen
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
              title="Phóng to toàn màn hình toàn bộ ứng dụng (ESC để thu nhỏ)"
            >
              {isAppFullscreen ? (
                <>
                  <Minimize className="w-4 h-4 text-amber-300" />
                  <span>THU NHỎ (ESC)</span>
                </>
              ) : (
                <>
                  <Maximize className="w-4 h-4" />
                  <span>TOÀN MÀN HÌNH</span>
                </>
              )}
            </button>

            {/* Compare Button */}
            <button
              onClick={() => {
                if (isCompareMode) {
                  setIsCompareMode(false);
                  setSelectedCompareItems([]);
                } else {
                  setIsCompareMode(true);
                }
              }}
              className={`px-4 py-2 font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 text-xs md:text-sm cursor-pointer ${
                isCompareMode
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 ring-4 ring-amber-400/40'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              title="Kích hoạt chế độ chọn 2 bài làm bất kỳ để phóng to so sánh"
            >
              <Columns2 className="w-4 h-4" />
              <span>
                {isCompareMode ? 'ĐANG CHỌN SO SÁNH' : 'SO SÁNH BÀI LÀM'}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN VIEWPORT FIT GRID */}
      <main className="flex-1 p-3 overflow-hidden">
        <div className={`w-full h-full grid gap-3 ${getGridColsClass()}`}>
          {state.groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isCompareMode={isCompareMode}
              selectedCompareItems={selectedCompareItems}
              onOpenQR={(g) => setActiveQRGroup(g)}
              onUpdateGroupName={handleUpdateGroupName}
              onClearGroupImages={handleClearGroupImages}
              onUploadImage={handleUploadImage}
              onRotateImage={handleRotateImage}
              onSetStars={handleSetStars}
              onToggleCompareSelect={handleToggleCompareSelect}
              onToggleMaximizeGroup={(groupId) => setFocusedGroupId(groupId)}
              onImageClick={(g, img) => {
                setSingleViewImage({
                  groupId: g.id,
                  groupName: g.name,
                  image: img
                });
              }}
            />
          ))}
        </div>
      </main>

      {/* POPUP MODALS MOUNTED */}

      {/* 1. Group Full Screen View */}
      {(() => {
        if (focusedGroupId === null) return null;
        const focusedGroup = state.groups.find((g) => g.id === focusedGroupId);
        if (!focusedGroup) return null;

        return (
          <GroupFullScreenView
            group={focusedGroup}
            onClose={() => setFocusedGroupId(null)}
            onOpenQR={(g) => setActiveQRGroup(g)}
            onUpdateGroupName={handleUpdateGroupName}
            onClearGroupImages={handleClearGroupImages}
            onUploadImage={handleUploadImage}
            onDeleteImage={handleDeleteImage}
            onRotateImage={handleRotateImage}
            onSetStars={handleSetStars}
            onImageClick={(g, img) => {
              setSingleViewImage({
                groupId: g.id,
                groupName: g.name,
                image: img
              });
            }}
          />
        );
      })()}

      {/* 2. QR Code Popup Modal */}
      {activeQRGroup && (
        <QRCodeModal
          isOpen={true}
          groupId={activeQRGroup.id}
          groupName={activeQRGroup.name}
          sessionId={state.sessionId}
          qrKey={activeQRGroup.qrKey}
          baseUrl={baseUrl}
          onResetQR={handleResetGroupQR}
          onClose={() => setActiveQRGroup(null)}
        />
      )}

      {/* 2. Single Image Zoom Modal */}
      {singleViewImage && (
        <SingleImageViewerModal
          isOpen={true}
          groupId={singleViewImage.groupId}
          groupName={singleViewImage.groupName}
          image={singleViewImage.image}
          onRotateImage={handleRotateImage}
          onClose={() => setSingleViewImage(null)}
        />
      )}

      {/* 3. Side-by-Side Compare Modal */}
      {selectedCompareItems.length >= 2 && (
        <CompareModal
          isOpen={true}
          selectedItems={selectedCompareItems}
          onRotateImage={handleRotateImage}
          onRemoveItem={handleRemoveCompareItem}
          onClose={() => {
            setIsCompareMode(false);
            setSelectedCompareItems([]);
          }}
        />
      )}

      {/* 4. Base URL / IP Config Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        baseUrl={baseUrl}
        sessionId={state.sessionId}
        groupCount={state.groupCount}
        onUpdateBaseUrl={(newUrl) => setBaseUrl(newUrl)}
        onClose={() => setIsConfigOpen(false)}
      />

      {/* 5. Reset All Confirm Modal */}
      <ConfirmModal
        isOpen={isResetAllConfirmOpen}
        title="Đặt lại tất cả bảng nhóm?"
        message="Hành động này sẽ dọn dẹp toàn bộ ảnh bài làm và điểm số trên tất cả các nhóm về trạng thái trống ban đầu. Các điện thoại học sinh đang kết nối vẫn giữ nguyên phiên làm việc và mã QR!"
        confirmText="Xác nhận Reset"
        cancelText="Hủy bỏ"
        variant="warning"
        onConfirm={() => {
          handleResetAll();
          setIsResetAllConfirmOpen(false);
        }}
        onCancel={() => setIsResetAllConfirmOpen(false)}
      />
    </div>
  );
}

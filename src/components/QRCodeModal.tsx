import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, RefreshCw, Copy, Check, ExternalLink } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  groupId: number;
  groupName: string;
  sessionId: string;
  qrKey: string;
  baseUrl: string;
  onResetQR: (groupId: number) => void;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  groupId,
  groupName,
  sessionId,
  qrKey,
  baseUrl,
  onResetQR,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  // Construct full student URL
  const studentUrl = `${baseUrl}?group=${groupId}&session=${sessionId}&qr=${qrKey}`;

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        studentUrl,
        {
          width: 280,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'H'
        },
        (error) => {
          if (error) console.error('QR Code generation error:', error);
        }
      );
    }
  }, [isOpen, studentUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(studentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy error:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden flex flex-col items-center text-center p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-2">
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-xs font-extrabold tracking-wider uppercase">
            MÃ PHIÊN: {sessionId}
          </span>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
            MÃ QR {groupName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Học sinh quét mã bằng camera điện thoại để gửi bài làm
          </p>
        </div>

        {/* High contrast B&W QR canvas */}
        <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-inner my-3 flex items-center justify-center">
          <canvas ref={canvasRef} className="max-w-full h-auto rounded-lg" />
        </div>

        {/* URL preview */}
        <div className="w-full bg-slate-100 dark:bg-slate-800/70 p-2.5 rounded-xl text-xs text-slate-600 dark:text-slate-300 font-mono truncate mb-4 flex items-center justify-between">
          <span className="truncate">{studentUrl}</span>
          <a
            href={studentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline ml-2 shrink-0 flex items-center gap-1"
            title="Mở tab mới"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col w-full gap-2.5">
          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                Đã sao chép đường link!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Sao chép đường link
              </>
            )}
          </button>

          <button
            onClick={() => onResetQR(groupId)}
            className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
            Tạo mã QR mới cho nhóm này
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Square, Repeat, Volume2, VolumeX, Move, Trash2, Check, RotateCcw, Type } from 'lucide-react';
import { ColorFilterSettings, OverlayItem, ZoomAnimation } from '../types';
import { CANVAS_HEIGHT, CANVAS_WIDTH, renderFrame } from '../utils/canvasRenderer';

interface CanvasPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isLooping: boolean;
  isMuted: boolean;
  zoom: ZoomAnimation;
  filters: ColorFilterSettings;
  overlays: OverlayItem[];
  selectedOverlayId: string | null;
  onSelectOverlay: (id: string | null) => void;
  onUpdateOverlayPosition: (id: string, x: number, y: number) => void;
  onDeleteOverlay?: (id: string) => void;
  onRestoreOverlay?: (item: OverlayItem) => void;
  onOpenMobileTools?: () => void;
  onTogglePlay: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onToggleLoop: () => void;
  onToggleMute: () => void;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  videoRef,
  currentTime,
  duration,
  isPlaying,
  isLooping,
  isMuted,
  zoom,
  filters,
  overlays,
  selectedOverlayId,
  onSelectOverlay,
  onUpdateOverlayPosition,
  onDeleteOverlay,
  onRestoreOverlay,
  onOpenMobileTools,
  onTogglePlay,
  onStop,
  onSeek,
  onToggleLoop,
  onToggleMute,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [isMovingMode, setIsMovingMode] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'delete' | 'move' | 'info';
    deletedItem?: OverlayItem;
  } | null>(null);

  const lastTapRef = useRef<{ id: string; time: number; x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressActiveRef = useRef(false);
  const toastTimerRef = useRef<number | null>(null);

  // Render canvas loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderFrame({
      ctx,
      video: videoRef.current,
      currentTime,
      zoom,
      filters,
      overlays,
      selectedOverlayId,
      isExporting: false,
    });
  }, [videoRef, currentTime, zoom, filters, overlays, selectedOverlayId]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Precise Hit Testing for stamps / text / images
  const getHitOverlay = (normX: number, normY: number): OverlayItem | null => {
    for (let i = overlays.length - 1; i >= 0; i--) {
      const item = overlays[i];
      const isVisible =
        currentTime >= item.startTime &&
        (item.endTime === -1 || currentTime <= item.endTime);
      if (!isVisible) continue;

      let halfW = 0.22;
      let halfH = 0.045;

      if (item.type === 'text') {
        const approxLen = (item.text || '').length;
        const fs = item.fontSize || 56;
        halfW = Math.max(0.14, ((approxLen * fs * 0.65 + 70) / CANVAS_WIDTH) / 2);
        halfH = Math.max(0.04, ((fs * 1.5 + 50) / CANVAS_HEIGHT) / 2);
      } else if (item.type === 'stamp') {
        halfW = (540 / CANVAS_WIDTH) / 2; // ~0.25
        halfH = (150 / CANVAS_HEIGHT) / 2; // ~0.04
      } else if (item.type === 'image') {
        halfW = ((item.width || 0.35) + 0.06) / 2;
        halfH = (((item.height || 0.35) * (CANVAS_WIDTH / CANVAS_HEIGHT)) + 0.06) / 2;
      }

      const scale = item.scale || 1.0;
      halfW *= scale;
      halfH *= scale;

      // Generous finger touch margin for mobile screens (~40-50px in native coordinates)
      const touchMarginX = 0.05;
      const touchMarginY = 0.04;

      const dx = Math.abs(normX - item.x);
      const dy = Math.abs(normY - item.y);

      if (dx <= halfW + touchMarginX && dy <= halfH + touchMarginY) {
        return item;
      }
    }
    return null;
  };

  // Touch & Pointer Down Handler (Supports Long-Press to Move & Double-Tap to Delete)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const clickNormX = (e.clientX - rect.left) / rect.width;
    const clickNormY = (e.clientY - rect.top) / rect.height;

    const hitItem = getHitOverlay(clickNormX, clickNormY);

    if (!hitItem) {
      onSelectOverlay(null);
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      lastTapRef.current = null;
      return;
    }

    const now = Date.now();
    const lastTap = lastTapRef.current;
    const distFromLastTap = lastTap ? Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) : 999;

    // 1. Check: DOUBLE TAP TO DELETE
    if (lastTap && lastTap.id === hitItem.id && now - lastTap.time < 380 && distFromLastTap < 40) {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      lastTapRef.current = null;
      isLongPressActiveRef.current = false;
      setIsDragging(false);
      setDraggedItemId(null);
      setIsMovingMode(false);

      // Trigger haptic vibration if supported
      if (navigator.vibrate) {
        try {
          navigator.vibrate([40, 50, 40]);
        } catch {
          // ignore
        }
      }

      const deleted = hitItem;
      if (onDeleteOverlay) {
        onDeleteOverlay(deleted.id);
      }

      // Show notification toast with Undo option
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      setToast({
        message: `「${deleted.text || 'スタンプ'}」を削除しました`,
        type: 'delete',
        deletedItem: deleted,
      });
      toastTimerRef.current = window.setTimeout(() => setToast(null), 4000);
      return;
    }

    // 2. First tap: select item & arm LONG PRESS to move
    lastTapRef.current = { id: hitItem.id, time: now, x: e.clientX, y: e.clientY };
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    onSelectOverlay(hitItem.id);

    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Set 300ms long press timer to activate move mode
    longPressTimerRef.current = window.setTimeout(() => {
      isLongPressActiveRef.current = true;
      setIsDragging(true);
      setDraggedItemId(hitItem.id);
      setIsMovingMode(true);

      if (navigator.vibrate) {
        try {
          navigator.vibrate(60);
        } catch {
          // ignore
        }
      }

      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      setToast({
        message: '📍 移動中: ドラッグして位置を調整',
        type: 'move',
      });
      toastTimerRef.current = window.setTimeout(() => {
        setToast((prev) => (prev?.type === 'move' ? null : prev));
      }, 2500);
    }, 300);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // If user moves before long press activates, cancel long press
    if (longPressTimerRef.current && !isLongPressActiveRef.current && pointerStartPosRef.current) {
      const dist = Math.hypot(
        e.clientX - pointerStartPosRef.current.x,
        e.clientY - pointerStartPosRef.current.y
      );
      if (dist > 14) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    // Active long-press dragging
    if (isLongPressActiveRef.current && draggedItemId) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      const normX = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const normY = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));

      onUpdateOverlayPosition(draggedItemId, normX, normY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false;
      setIsDragging(false);
      setDraggedItemId(null);
      setIsMovingMode(false);

      try {
        canvasRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      setToast({ message: '位置を配置しました', type: 'info' });
      toastTimerRef.current = window.setTimeout(() => setToast(null), 1500);
    }

    pointerStartPosRef.current = null;
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    isLongPressActiveRef.current = false;
    setIsDragging(false);
    setDraggedItemId(null);
    setIsMovingMode(false);
    pointerStartPosRef.current = null;
  };

  const formatTime = (seconds: number) => {
    const safeSec = Math.max(0, isNaN(seconds) ? 0 : seconds);
    const m = Math.floor(safeSec / 60);
    const s = Math.floor(safeSec % 60);
    const ms = Math.floor((safeSec % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-2 sm:p-5 bg-zinc-950/60 overflow-hidden relative select-none w-full h-full">
      {/* 9:16 Phone Mockup Viewport */}
      <div
        ref={containerRef}
        className="flex-1 w-full flex items-center justify-center min-h-0 py-1 sm:py-2 px-1"
      >
        <div className="relative aspect-[9/16] h-full max-h-[calc(100dvh-200px)] sm:max-h-[640px] max-w-[360px] bg-black rounded-[20px] sm:rounded-[40px] p-1.5 sm:p-2.5 shadow-2xl shadow-black/80 ring-1 ring-zinc-800 flex items-center justify-center overflow-hidden">
          {/* Top Notch / Camera Pill (Desktop only to maximize screen on mobile) */}
          <div className="hidden sm:flex absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-zinc-900 rounded-full z-20 pointer-events-none items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-zinc-800" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-950 border border-zinc-800" />
          </div>

          {/* Active Moving Status Badge */}
          {isMovingMode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-indigo-600/95 text-white px-3 py-1 rounded-full text-[11px] font-bold shadow-xl border border-indigo-400/40 pointer-events-none flex items-center gap-1.5 z-30 animate-pulse whitespace-nowrap">
              <Move className="w-3.5 h-3.5" />
              <span>移動中（指を離すと配置確定）</span>
            </div>
          )}

          {/* 1080x1920 Native Canvas */}
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full object-cover rounded-[16px] sm:rounded-[30px] cursor-grab active:cursor-grabbing transition-transform touch-none"
            style={{ touchAction: 'none' }}
          />

          {/* Touch Interaction Guide Badge */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium text-zinc-300 border border-zinc-700/60 pointer-events-none flex items-center gap-1.5 shadow-lg whitespace-nowrap z-20">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            <span>長押しで移動 • 2回タップで削除</span>
          </div>

          {/* Floating Toast Notification (Undo Delete / Placement feedback) */}
          {toast && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-zinc-900/95 border border-zinc-700/90 text-zinc-100 px-3.5 py-2 rounded-xl text-xs shadow-2xl backdrop-blur flex items-center gap-2.5 z-30 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
              {toast.type === 'delete' ? (
                <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              ) : (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span className="font-medium">{toast.message}</span>
              {toast.type === 'delete' && toast.deletedItem && onRestoreOverlay && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (toast.deletedItem) {
                      onRestoreOverlay(toast.deletedItem);
                      setToast({ message: 'スタンプを元に戻しました', type: 'info' });
                      setTimeout(() => setToast(null), 1800);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] ml-1 transition active:scale-95 shadow"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>元に戻す</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modern Player Controls Deck (Responsive & Touch-friendly) */}
      <div className="w-full max-w-[360px] sm:max-w-md bg-zinc-900/95 border border-zinc-800 rounded-2xl p-2.5 sm:p-4 shadow-xl shrink-0 mt-1 sm:mt-2 space-y-2 sm:space-y-3">
        {/* Timeline Scrubber */}
        <div className="flex items-center gap-2 sm:gap-3">
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 10}
            step={0.05}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="flex-1 h-3 sm:h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition"
          />
          <span className="font-mono text-[11px] sm:text-xs text-zinc-400 font-semibold min-w-[75px] sm:min-w-[95px] text-right">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onTogglePlay}
              className="flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition active:scale-95"
              title={isPlaying ? '一時停止' : '再生'}
            >
              {isPlaying ? <Pause className="w-5 h-5 sm:w-4 sm:h-4" /> : <Play className="w-5 h-5 sm:w-4 sm:h-4 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={onStop}
              className="flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition active:scale-95"
              title="停止 (最初に戻る)"
            >
              <Square className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>

            <button
              type="button"
              onClick={onToggleLoop}
              className={`flex items-center gap-1 h-10 sm:h-9 px-2.5 rounded-xl text-xs font-medium border transition active:scale-95 ${
                isLooping
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                  : 'bg-zinc-800 border-zinc-700/60 text-zinc-400'
              }`}
              title="ループ再生切替"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">{isLooping ? 'LOOP' : 'OFF'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              className="flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition active:scale-95"
              title={isMuted ? 'ミュート解除' : 'ミュート'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Mobile View Switcher to Tools */}
            {onOpenMobileTools && (
              <button
                type="button"
                onClick={onOpenMobileTools}
                className="lg:hidden flex items-center gap-1 px-3 h-10 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 font-semibold text-xs active:scale-95 transition"
                title="編集パネルを開く"
              >
                <Type className="w-3.5 h-3.5" />
                <span>編集</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


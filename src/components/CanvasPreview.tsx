import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Square, Repeat, Volume2, VolumeX, Move } from 'lucide-react';
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

  // Mouse & Touch Drag Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const clickNormX = (e.clientX - rect.left) / rect.width;
    const clickNormY = (e.clientY - rect.top) / rect.height;

    // Check hit test for overlays (reverse order for top-most first)
    for (let i = overlays.length - 1; i >= 0; i--) {
      const item = overlays[i];
      // Simple distance check in normalized coordinates
      const dx = clickNormX - item.x;
      const dy = clickNormY - item.y;
      const dist = Math.sqrt(dx * dx + (dy * dy) * 1.5);

      if (dist < 0.15) {
        setIsDragging(true);
        setDraggedItemId(item.id);
        onSelectOverlay(item.id);
        canvas.setPointerCapture(e.pointerId);
        break;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging || !draggedItemId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const normX = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const normY = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));

    onUpdateOverlayPosition(draggedItemId, normX, normY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedItemId(null);
      try {
        canvasRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const formatTime = (seconds: number) => {
    const safeSec = Math.max(0, isNaN(seconds) ? 0 : seconds);
    const m = Math.floor(safeSec / 60);
    const s = Math.floor(safeSec % 60);
    const ms = Math.floor((safeSec % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-3 sm:p-5 bg-zinc-950/60 overflow-hidden relative select-none">
      {/* 9:16 Phone Mockup Viewport */}
      <div
        ref={containerRef}
        className="flex-1 w-full flex items-center justify-center min-h-0 py-2"
      >
        <div className="relative aspect-[9/16] h-full max-h-[640px] max-w-[360px] bg-black rounded-[32px] sm:rounded-[40px] p-2.5 shadow-2xl shadow-black/80 ring-1 ring-zinc-800 flex items-center justify-center overflow-hidden">
          {/* Top Notch / Camera Pill */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-zinc-900 rounded-full z-20 pointer-events-none flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-zinc-800" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-950 border border-zinc-800" />
          </div>

          {/* 1080x1920 Native Canvas */}
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-full h-full object-cover rounded-[24px] sm:rounded-[30px] cursor-grab active:cursor-grabbing transition-transform"
          />

          {/* Drag Overlay Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-medium text-zinc-300 border border-zinc-700/50 pointer-events-none flex items-center gap-1.5 opacity-80 hover:opacity-100">
            <Move className="w-3 h-3 text-indigo-400" />
            <span>透かしやテキストをドラッグして配置</span>
          </div>
        </div>
      </div>

      {/* Modern Player Controls Deck */}
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-xl shrink-0 mt-2 space-y-3">
        {/* Timeline Scrubber */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 10}
            step={0.05}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition"
          />
          <span className="font-mono text-xs text-zinc-400 font-semibold min-w-[95px] text-right">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTogglePlay}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition active:scale-95"
              title={isPlaying ? '一時停止' : '再生'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={onStop}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition active:scale-95"
              title="停止 (最初に戻る)"
            >
              <Square className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onToggleLoop}
              className={`flex items-center gap-1.5 px-2.5 h-9 rounded-xl text-xs font-medium border transition ${
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition active:scale-95"
              title={isMuted ? 'ミュート解除' : 'ミュート'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

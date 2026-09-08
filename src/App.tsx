import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, SlidersHorizontal, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Header } from './components/Header';
import { CanvasPreview } from './components/CanvasPreview';
import { SidebarTabs } from './components/SidebarTabs';
import { ExportModal } from './components/ExportModal';
import { StandaloneModal } from './components/StandaloneModal';
import { ColorFilterSettings, OverlayItem, ZoomAnimation, VideoLoadState } from './types';
import { generateSampleShortsVideo } from './utils/sampleVideoGenerator';
import { exportShortsVideo, ExportProgress } from './utils/exportVideo';

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoLoadTimerRef = useRef<number | null>(null);

  // Mobile View Switcher (Preview vs Editing Tools)
  const [mobileView, setMobileView] = useState<'preview' | 'tools'>('preview');

  // Video State & Diagnostic Check
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(6);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLoadingSample, setIsLoadingSample] = useState<boolean>(false);
  const [videoLoadState, setVideoLoadState] = useState<VideoLoadState>({
    status: 'idle',
  });

  // Overlays State (Stamps, Texts, Images)
  const [overlays, setOverlays] = useState<OverlayItem[]>([
    {
      id: 'stamp-initial',
      type: 'stamp',
      stampVariant: 'reprint_prohibited',
      text: '無断転載禁止',
      x: 0.5,
      y: 0.82,
      scale: 1.0,
      rotation: 0,
      opacity: 0.95,
      startTime: 0,
      endTime: -1,
    },
    {
      id: 'text-initial',
      type: 'text',
      text: 'YouTube Shorts / TikTok',
      fontSize: 48,
      fontWeight: '900',
      fillColor: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backgroundPadding: 20,
      borderRadius: 14,
      strokeColor: '#000000',
      strokeWidth: 2,
      x: 0.5,
      y: 0.18,
      scale: 1.0,
      rotation: 0,
      opacity: 1.0,
      startTime: 0,
      endTime: -1,
    },
  ]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>('stamp-initial');

  // Zoom Animation State
  const [zoom, setZoom] = useState<ZoomAnimation>({
    enabled: true,
    startTime: 1.0,
    endTime: 4.5,
    startScale: 1.0,
    endScale: 1.5,
    focusX: 0.5,
    focusY: 0.5,
    easing: 'ease-in-out',
  });

  // Color Filters State
  const [filters, setFilters] = useState<ColorFilterSettings>({
    preset: 'normal',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sepia: 0,
    grayscale: 0,
    hueRotate: 0,
    blur: 0,
  });

  // Modals State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportResult, setExportResult] = useState<{ downloadUrl: string; filename: string } | null>(null);
  const [isStandaloneModalOpen, setIsStandaloneModalOpen] = useState(false);

  // Initialize hidden video element
  useEffect(() => {
    const v = document.createElement('video');
    v.crossOrigin = 'anonymous';
    v.playsInline = true;
    v.muted = false;
    v.preload = 'auto';

    v.onloadedmetadata = () => {
      const dur = v.duration || 6;
      setVideoDuration(dur);
      setZoom((prev) => ({
        ...prev,
        endTime: Math.min(dur, Math.max(2, dur * 0.7)),
      }));
    };

    v.ontimeupdate = () => {
      setCurrentTime(v.currentTime);
    };

    v.onended = () => {
      if (isLooping) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        setIsPlaying(false);
      }
    };

    videoRef.current = v;

    // Automatically load initial sample video so user sees full features working immediately
    handleLoadSampleVideo();

    return () => {
      v.pause();
      v.src = '';
    };
  }, []);

  // Synchronize loop state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = isLooping;
    }
  }, [isLooping]);

  // Synchronize mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Animation frame loop for time sync while playing
  useEffect(() => {
    let animId: number;
    const updateLoop = () => {
      if (videoRef.current && isPlaying) {
        setCurrentTime(videoRef.current.currentTime);
      }
      animId = requestAnimationFrame(updateLoop);
    };
    animId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Load sample video
  const handleLoadSampleVideo = async () => {
    try {
      setIsLoadingSample(true);
      setVideoLoadState({
        status: 'loading',
        fileName: '9:16 サンプル動画 (自動生成)',
      });
      const { url } = await generateSampleShortsVideo(6);
      loadVideo(url, '9:16 サンプル動画 (Shorts対応)', 2.4 * 1024 * 1024, 'video/mp4');
    } catch (e) {
      console.error('Failed to generate sample video:', e);
      setVideoLoadState({
        status: 'error',
        fileName: '9:16 サンプル動画',
        errorMessage: 'サンプル動画の生成に失敗しました。',
        errorDetail: String(e),
      });
    } finally {
      setIsLoadingSample(false);
    }
  };

  const loadVideo = (
    url: string,
    fileName: string = '動画ファイル',
    fileSize: number = 0,
    mimeType: string = 'video/mp4'
  ) => {
    const v = videoRef.current;
    if (!v) return;

    if (videoLoadTimerRef.current) {
      window.clearTimeout(videoLoadTimerRef.current);
      videoLoadTimerRef.current = null;
    }

    setVideoSrc(url);
    setIsPlaying(false);
    setCurrentTime(0);

    setVideoLoadState({
      status: 'loading',
      fileName,
      fileSize,
    });

    const onLoadedMetadata = () => {
      if (videoLoadTimerRef.current) {
        window.clearTimeout(videoLoadTimerRef.current);
        videoLoadTimerRef.current = null;
      }

      const dur = v.duration || 6;
      const width = v.videoWidth || 1080;
      const height = v.videoHeight || 1920;
      const isPortrait = height >= width;
      const sizeMB = fileSize > 0 ? Number((fileSize / (1024 * 1024)).toFixed(2)) : 2.5;

      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(Math.round(width), Math.round(height)) || 1;
      const aspectSimple = `${Math.round(width / divisor)}:${Math.round(height / divisor)}`;

      setVideoDuration(dur);
      setZoom((prev) => ({
        ...prev,
        endTime: Math.min(dur, Math.max(2, dur * 0.7)),
      }));

      setVideoLoadState({
        status: 'loaded',
        fileName,
        fileSize,
        diagnostics: {
          name: fileName,
          sizeMB,
          width,
          height,
          duration: dur,
          aspectRatio: aspectSimple,
          isPortrait,
          hasAudio: true,
          mimeType: mimeType || 'video/mp4',
        },
      });
    };

    const onError = () => {
      if (videoLoadTimerRef.current) {
        window.clearTimeout(videoLoadTimerRef.current);
        videoLoadTimerRef.current = null;
      }

      const err = v.error;
      let msg = '動画の読み込みに失敗しました。';
      let detail = 'お使いのブラウザまたは端末がこの動画形式に対応していない可能性があります。';

      if (err) {
        switch (err.code) {
          case 1:
            msg = '読み込みが中断されました';
            detail = '動画の読み込み処理が途中でキャンセルされました。';
            break;
          case 2:
            msg = 'ネットワークエラー';
            detail = '動画ファイルの読み込み中に通信またはデータ読み込みエラーが発生しました。';
            break;
          case 3:
            msg = '動画デコード（解析）エラー';
            detail = 'ファイルが破損しているか、ブラウザが対応していないビデオコーデックです。';
            break;
          case 4:
            msg = '非対応の動画形式・コーデック';
            detail = 'iPhone等の高効率(HEVC / H.265)やProRes形式はブラウザで直接再生できない場合があります。標準的なH.264のMP4形式をお試しいただくか、サンプル動画をお使いください。';
            break;
          default:
            detail = err.message || detail;
        }
      }

      setVideoLoadState({
        status: 'error',
        fileName,
        fileSize,
        errorMessage: msg,
        errorDetail: detail,
      });
    };

    v.onloadedmetadata = onLoadedMetadata;
    v.onerror = onError;

    // Timeout guard for mobile Safari when media hangs without emitting events
    videoLoadTimerRef.current = window.setTimeout(() => {
      if (v.readyState === 0 && !v.videoWidth) {
        setVideoLoadState({
          status: 'error',
          fileName,
          fileSize,
          errorMessage: '読み込みタイムアウト（応答なし）',
          errorDetail: 'ブラウザがこの動画形式（iPhone高効率HEVC形式や非対応コンテナ等）をデコードできない可能性があります。MP4形式への変換またはサンプル動画をお試しください。',
        });
      }
    }, 9000);

    v.src = url;
    v.load();
  };

  // Video File Upload Handler
  const handleFileUpload = (file: File) => {
    if (!file) return;

    if (file.size === 0) {
      setVideoLoadState({
        status: 'error',
        fileName: file.name,
        fileSize: 0,
        errorMessage: 'ファイルサイズが0バイトです',
        errorDetail: '選択された動画ファイルが空です。有効な動画を選択してください。',
      });
      return;
    }

    const url = URL.createObjectURL(file);
    loadVideo(url, file.name, file.size, file.type);
  };

  // Playback Control Handlers
  const handleTogglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;

    if (v.paused) {
      try {
        await v.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Playback error:', err);
      }
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleSeek = (time: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = time;
    setCurrentTime(time);
  };

  const handleToggleLoop = () => {
    setIsLooping((prev) => !prev);
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  // Overlay Manipulation Handlers
  const handleUpdateOverlayPosition = useCallback((id: string, x: number, y: number) => {
    setOverlays((prev) =>
      prev.map((item) => (item.id === id ? { ...item, x, y } : item))
    );
  }, []);

  const handleAddText = (
    text: string,
    fSize: number,
    fillCol: string,
    bgCol: string
  ) => {
    const newItem: OverlayItem = {
      id: `text-${Date.now()}`,
      type: 'text',
      text: text.trim() || 'Text',
      fontSize: fSize,
      fillColor: fillCol,
      backgroundColor: bgCol,
      backgroundPadding: 20,
      borderRadius: 14,
      strokeColor: '#000000',
      strokeWidth: 2,
      x: 0.5,
      y: 0.35,
      scale: 1.0,
      rotation: 0,
      opacity: 1.0,
      startTime: 0,
      endTime: -1,
    };
    setOverlays((prev) => [...prev, newItem]);
    setSelectedOverlayId(newItem.id);
  };

  const handleAddStamp = (
    variant: 'reprint_prohibited' | 'strictly_confidential' | 'sample' | 'custom',
    text: string
  ) => {
    const newItem: OverlayItem = {
      id: `stamp-${Date.now()}`,
      type: 'stamp',
      stampVariant: variant,
      text,
      x: 0.5,
      y: 0.5,
      scale: 1.0,
      rotation: 0,
      opacity: 0.95,
      startTime: 0,
      endTime: -1,
    };
    setOverlays((prev) => [...prev, newItem]);
    setSelectedOverlayId(newItem.id);
  };

  const handleAddImageStamp = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const newItem: OverlayItem = {
          id: `img-${Date.now()}`,
          type: 'image',
          imageElement: img,
          imageDataUrl: dataUrl,
          width: 0.35,
          x: 0.5,
          y: 0.5,
          scale: 1.0,
          rotation: 0,
          opacity: 0.9,
          startTime: 0,
          endTime: -1,
        };
        setOverlays((prev) => [...prev, newItem]);
        setSelectedOverlayId(newItem.id);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateOverlay = (id: string, updates: Partial<OverlayItem>) => {
    setOverlays((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleDeleteOverlay = (id: string) => {
    setOverlays((prev) => prev.filter((item) => item.id !== id));
    if (selectedOverlayId === id) {
      setSelectedOverlayId(null);
    }
  };

  const handleRestoreOverlay = (item: OverlayItem) => {
    setOverlays((prev) => [...prev, item]);
    setSelectedOverlayId(item.id);
  };

  // Zoom & Filter Handlers
  const handleUpdateZoom = (updates: Partial<ZoomAnimation>) => {
    setZoom((prev) => ({ ...prev, ...updates }));
  };

  const handleUpdateFilters = (updates: Partial<ColorFilterSettings>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  // Export Video Handler
  const handleStartExport = async () => {
    if (!videoSrc) return;

    // Pause current player
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    setIsExportModalOpen(true);
    setExportProgress({
      progress: 0,
      currentTime: 0,
      totalDuration: videoDuration,
      status: 'preparing',
    });
    setExportResult(null);

    try {
      const res = await exportShortsVideo({
        videoSrc,
        duration: videoDuration,
        zoom,
        filters,
        overlays,
        onProgress: (p) => setExportProgress(p),
      });
      setExportResult({ downloadUrl: res.downloadUrl, filename: res.filename });
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Top Header */}
      <Header
        onLoadSample={handleLoadSampleVideo}
        onOpenExport={handleStartExport}
        onOpenStandaloneModal={() => setIsStandaloneModalOpen(true)}
        isLoadingSample={isLoadingSample}
        hasVideo={Boolean(videoSrc)}
        videoLoadState={videoLoadState}
      />

      {/* Mobile View Switcher (Segmented Control for Smartphones) */}
      <div className="lg:hidden flex items-center justify-center gap-2 px-3 py-1.5 bg-zinc-900/90 border-b border-zinc-800 shrink-0">
        <button
          type="button"
          onClick={() => setMobileView('preview')}
          className={`flex-1 max-w-[190px] flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-xs font-bold transition active:scale-95 ${
            mobileView === 'preview'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {videoLoadState.status === 'loading' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
          ) : videoLoadState.status === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          <span>プレビュー</span>
          {videoLoadState.status === 'loaded' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setMobileView('tools')}
          className={`flex-1 max-w-[190px] flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-xs font-bold transition active:scale-95 ${
            mobileView === 'tools'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>編集ツール {overlays.length > 0 && `(${overlays.length})`}</span>
          {videoLoadState.status === 'error' && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-bold">
              要確認
            </span>
          )}
        </button>
      </div>

      {/* Main Workspace: 9:16 Canvas Viewport & Sidebar Controls */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Canvas Preview: Full height on mobile when active */}
        <div className={`flex-1 flex-col min-h-0 ${mobileView === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
          <CanvasPreview
            videoRef={videoRef}
            currentTime={currentTime}
            duration={videoDuration}
            isPlaying={isPlaying}
            isLooping={isLooping}
            isMuted={isMuted}
            zoom={zoom}
            filters={filters}
            overlays={overlays}
            selectedOverlayId={selectedOverlayId}
            onSelectOverlay={setSelectedOverlayId}
            onUpdateOverlayPosition={handleUpdateOverlayPosition}
            onDeleteOverlay={handleDeleteOverlay}
            onRestoreOverlay={handleRestoreOverlay}
            onOpenMobileTools={() => setMobileView('tools')}
            onLoadSample={handleLoadSampleVideo}
            videoLoadState={videoLoadState}
            onTogglePlay={handleTogglePlay}
            onStop={handleStop}
            onSeek={handleSeek}
            onToggleLoop={handleToggleLoop}
            onToggleMute={handleToggleMute}
          />
        </div>

        {/* Sidebar Tabs: Full height scrollable on mobile when active */}
        <div className={`flex-col ${mobileView === 'tools' ? 'flex flex-1 h-full' : 'hidden lg:flex'}`}>
          <SidebarTabs
            onFileUpload={handleFileUpload}
            onLoadSample={handleLoadSampleVideo}
            isLoadingSample={isLoadingSample}
            videoDuration={videoDuration}
            overlays={overlays}
            selectedOverlayId={selectedOverlayId}
            onSelectOverlay={setSelectedOverlayId}
            onAddText={handleAddText}
            onAddStamp={handleAddStamp}
            onAddImageStamp={handleAddImageStamp}
            onUpdateOverlay={handleUpdateOverlay}
            onDeleteOverlay={handleDeleteOverlay}
            zoom={zoom}
            onUpdateZoom={handleUpdateZoom}
            filters={filters}
            onUpdateFilters={handleUpdateFilters}
            onStartExport={handleStartExport}
            hasVideo={Boolean(videoSrc)}
            onSwitchToPreview={() => setMobileView('preview')}
            videoLoadState={videoLoadState}
          />
        </div>
      </main>

      {/* Export Progress & Download Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        progress={exportProgress}
        result={exportResult}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Standalone Single-File HTML Code & Download Modal */}
      <StandaloneModal
        isOpen={isStandaloneModalOpen}
        onClose={() => setIsStandaloneModalOpen(false)}
      />
    </div>
  );
}

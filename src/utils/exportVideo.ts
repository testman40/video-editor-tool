import { ColorFilterSettings, OverlayItem, ZoomAnimation } from '../types';
import { CANVAS_HEIGHT, CANVAS_WIDTH, renderFrame } from './canvasRenderer';

export interface ExportProgress {
  progress: number; // 0 to 100
  currentTime: number;
  totalDuration: number;
  status: 'preparing' | 'rendering' | 'encoding' | 'completed' | 'error';
  errorMessage?: string;
}

export function getSupportedMimeType(): { mimeType: string; extension: string } {
  const types = [
    { mime: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"', ext: 'mp4' },
    { mime: 'video/mp4; codecs=h264,aac', ext: 'mp4' },
    { mime: 'video/mp4; codecs=h264', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm; codecs=h264,opus', ext: 'mp4' },
    { mime: 'video/webm; codecs=vp9,opus', ext: 'webm' },
    { mime: 'video/webm; codecs=vp8,opus', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
  ];

  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t.mime)) {
      return { mimeType: t.mime, extension: t.ext };
    }
  }

  return { mimeType: 'video/webm', extension: 'webm' };
}

export async function exportShortsVideo({
  videoSrc,
  duration,
  zoom,
  filters,
  overlays,
  onProgress,
}: {
  videoSrc: string;
  duration: number;
  zoom: ZoomAnimation;
  filters: ColorFilterSettings;
  overlays: OverlayItem[];
  onProgress: (p: ExportProgress) => void;
}): Promise<{ blob: Blob; downloadUrl: string; filename: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      onProgress({
        progress: 0,
        currentTime: 0,
        totalDuration: duration,
        status: 'preparing',
      });

      // 1. Create dedicated off-screen rendering canvas (1080x1920)
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = CANVAS_WIDTH;
      exportCanvas.height = CANVAS_HEIGHT;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');

      // 2. Create dedicated video element for export to prevent glitching UI player
      const exportVideo = document.createElement('video');
      exportVideo.crossOrigin = 'anonymous';
      exportVideo.src = videoSrc;
      exportVideo.muted = false;
      exportVideo.playsInline = true;
      exportVideo.preload = 'auto';

      await new Promise<void>((res, rej) => {
        exportVideo.onloadedmetadata = () => res();
        exportVideo.onerror = (e) => rej(new Error('Failed to load video source for export'));
      });

      const totalDuration = duration || exportVideo.duration || 5;

      // 3. Setup AudioContext to capture original video audio
      let audioStream: MediaStream | null = null;
      let audioCtx: AudioContext | null = null;

      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new AudioContextClass();
        const source = audioCtx.createMediaElementSource(exportVideo);
        const destination = audioCtx.createMediaStreamDestination();
        source.connect(destination);
        // Do not connect to audioCtx.destination during export to avoid loud double echo
        audioStream = destination.stream;
      } catch (err) {
        console.warn('Audio capture bypassed or video has no accessible audio track:', err);
      }

      // 4. Capture canvas stream at 30 fps
      const canvasStream = exportCanvas.captureStream(30);

      // 5. Combine video and audio tracks
      const outputTracks = [...canvasStream.getVideoTracks()];
      if (audioStream && audioStream.getAudioTracks().length > 0) {
        outputTracks.push(...audioStream.getAudioTracks());
      }
      const combinedStream = new MediaStream(outputTracks);

      // 6. MediaRecorder configuration
      const { mimeType, extension } = getSupportedMimeType();
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 8_000_000, // 8 Mbps high quality for 1080p Shorts
      });

      const recordedChunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      let animationFrameId: number;

      recorder.onstop = () => {
        cancelAnimationFrame(animationFrameId);
        if (audioCtx) {
          try {
            audioCtx.close();
          } catch {
            // ignore
          }
        }
        exportVideo.pause();
        exportVideo.src = '';

        onProgress({
          progress: 100,
          currentTime: totalDuration,
          totalDuration,
          status: 'encoding',
        });

        const outputBlob = new Blob(recordedChunks, { type: mimeType });
        const downloadUrl = URL.createObjectURL(outputBlob);
        const filename = `shorts_9_16_${Date.now()}.${extension === 'mp4' ? 'mp4' : 'mp4'}`;

        onProgress({
          progress: 100,
          currentTime: totalDuration,
          totalDuration,
          status: 'completed',
        });

        resolve({ blob: outputBlob, downloadUrl, filename });
      };

      // Reset playback to start
      exportVideo.currentTime = 0;
      await exportVideo.play();
      recorder.start(100);

      onProgress({
        progress: 1,
        currentTime: 0,
        totalDuration,
        status: 'rendering',
      });

      // Frame rendering loop
      const renderLoop = () => {
        const cTime = exportVideo.currentTime;
        const progressPct = Math.min(99, Math.floor((cTime / totalDuration) * 100));

        // Render current frame onto export canvas
        renderFrame({
          ctx,
          video: exportVideo,
          currentTime: cTime,
          zoom,
          filters,
          overlays,
          selectedOverlayId: null,
          isExporting: true, // hides selection outlines & drag handles
        });

        onProgress({
          progress: progressPct,
          currentTime: cTime,
          totalDuration,
          status: 'rendering',
        });

        if (exportVideo.ended || cTime >= totalDuration - 0.05) {
          recorder.stop();
        } else {
          animationFrameId = requestAnimationFrame(renderLoop);
        }
      };

      renderLoop();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '書き出し中にエラーが発生しました';
      onProgress({
        progress: 0,
        currentTime: 0,
        totalDuration: duration,
        status: 'error',
        errorMessage: msg,
      });
      reject(err);
    }
  });
}

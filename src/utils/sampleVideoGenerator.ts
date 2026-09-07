/**
 * Generates a procedural 9:16 vertical test video (with audio)
 * so the user can test the editor immediately without uploading a file.
 */
export async function generateSampleShortsVideo(durationSec = 6): Promise<{ blob: Blob; url: string }> {
  const width = 720;
  const height = 1280;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Audio generation using AudioContext (safe against browser autoplay restrictions)
  let audioTracks: MediaStreamTrack[] = [];
  let osc: OscillatorNode | null = null;
  let audioCtx: AudioContext | null = null;

  try {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
      if (audioCtx.createMediaStreamDestination) {
        const dest = audioCtx.createMediaStreamDestination();
        osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();

        const notes = [440, 554.37, 659.25, 880, 659.25, 554.37];
        for (let i = 0; i < durationSec * 2; i++) {
          const t = audioCtx.currentTime + i * 0.5;
          osc.frequency.setValueAtTime(notes[i % notes.length], t);
        }
        audioTracks = dest.stream.getAudioTracks();
      }
    }
  } catch (audioErr) {
    console.warn('AudioContext skipped or restricted by browser:', audioErr);
  }

  // Combine canvas stream and audio stream safely
  const captureStreamFn = canvas.captureStream || (canvas as unknown as { mozCaptureStream?: (fps: number) => MediaStream }).mozCaptureStream;
  if (!captureStreamFn) {
    throw new Error('canvas.captureStream is not supported');
  }
  const canvasStream = captureStreamFn.call(canvas, 30);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioTracks,
  ]);

  // Determine supported mimeType
  let mimeType = 'video/webm; codecs=vp8,opus';
  if (typeof MediaRecorder !== 'undefined') {
    if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9,opus')) {
      mimeType = 'video/webm; codecs=vp9,opus';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
    }
  } else {
    throw new Error('MediaRecorder is not supported');
  }

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 3_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve) => {
    recorder.onstop = () => {
      osc.stop();
      audioCtx.close();
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      resolve({ blob, url });
    };

    recorder.start(100);

    const startTime = performance.now();

    function draw() {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed >= durationSec) {
        recorder.stop();
        return;
      }

      // Draw dynamic animated background
      const grad = ctx!.createLinearGradient(0, 0, width, height);
      const hue1 = (elapsed * 40) % 360;
      const hue2 = (hue1 + 60) % 360;
      grad.addColorStop(0, `hsl(${hue1}, 70%, 20%)`);
      grad.addColorStop(0.5, `hsl(${hue2}, 60%, 15%)`);
      grad.addColorStop(1, '#09090b');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, width, height);

      // Draw moving vertical lines & particles
      ctx!.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx!.lineWidth = 2;
      for (let x = 40; x < width; x += 80) {
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, height);
        ctx!.stroke();
      }

      // Floating spheres
      for (let i = 0; i < 5; i++) {
        const offset = i * 1.2;
        const cx = width / 2 + Math.sin(elapsed * 2 + offset) * 180;
        const cy = height * 0.4 + Math.cos(elapsed * 1.5 + offset) * 220;
        const r = 40 + Math.sin(elapsed * 3 + offset) * 15;

        const sphereGrad = ctx!.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
        sphereGrad.addColorStop(0, `hsla(${(hue1 + i * 45) % 360}, 90%, 75%, 0.8)`);
        sphereGrad.addColorStop(1, `hsla(${(hue1 + i * 45) % 360}, 90%, 45%, 0.1)`);
        ctx!.fillStyle = sphereGrad;
        ctx!.beginPath();
        ctx!.arc(cx, cy, r, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Center title text
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.fillStyle = '#ffffff';
      ctx!.font = '900 48px sans-serif';
      ctx!.fillText('9:16 Shorts / TikTok', width / 2, height * 0.48);

      ctx!.font = '500 24px sans-serif';
      ctx!.fillStyle = '#a1a1aa';
      ctx!.fillText('Sample Vertical Video Clip', width / 2, height * 0.53);

      // Countdown Timer
      const remaining = Math.max(0, durationSec - elapsed).toFixed(1);
      ctx!.fillStyle = '#38bdf8';
      ctx!.font = '700 36px monospace';
      ctx!.fillText(`00:0${Math.floor(elapsed)} / 00:0${durationSec} (${remaining}s)`, width / 2, height * 0.6);

      // Progress bar at bottom
      const progress = elapsed / durationSec;
      ctx!.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx!.fillRect(40, height - 80, width - 80, 8);
      ctx!.fillStyle = '#6366f1';
      ctx!.fillRect(40, height - 80, (width - 80) * progress, 8);

      requestAnimationFrame(draw);
    }

    draw();
  });
}

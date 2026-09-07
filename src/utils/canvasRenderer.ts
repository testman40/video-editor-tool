import { ColorFilterSettings, OverlayItem, ZoomAnimation } from '../types';

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;

export function calculateZoomScale(
  zoom: ZoomAnimation,
  currentTime: number
): { scale: number; focusX: number; focusY: number } {
  if (!zoom.enabled) {
    return { scale: 1.0, focusX: 0.5, focusY: 0.5 };
  }

  if (currentTime < zoom.startTime) {
    return { scale: zoom.startScale, focusX: zoom.focusX, focusY: zoom.focusY };
  }

  if (currentTime > zoom.endTime) {
    return { scale: zoom.endScale, focusX: zoom.focusX, focusY: zoom.focusY };
  }

  const duration = Math.max(0.001, zoom.endTime - zoom.startTime);
  let t = Math.min(1, Math.max(0, (currentTime - zoom.startTime) / duration));

  // Easing
  if (zoom.easing === 'ease-in-out') {
    t = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  } else if (zoom.easing === 'ease-out') {
    t = Math.sin((t * Math.PI) / 2);
  }

  const scale = zoom.startScale + (zoom.endScale - zoom.startScale) * t;
  return { scale, focusX: zoom.focusX, focusY: zoom.focusY };
}

export function buildFilterString(filters: ColorFilterSettings): string {
  const parts: string[] = [];
  if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
  if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
  if (filters.saturation !== 100) parts.push(`saturate(${filters.saturation}%)`);
  if (filters.grayscale > 0) parts.push(`grayscale(${filters.grayscale}%)`);
  if (filters.sepia > 0) parts.push(`sepia(${filters.sepia}%)`);
  if (filters.hueRotate > 0) parts.push(`hue-rotate(${filters.hueRotate}deg)`);
  if (filters.blur > 0) parts.push(`blur(${filters.blur}px)`);

  return parts.length > 0 ? parts.join(' ') : 'none';
}

export function renderFrame({
  ctx,
  video,
  currentTime,
  zoom,
  filters,
  overlays,
  selectedOverlayId,
  isExporting = false,
}: {
  ctx: CanvasRenderingContext2D;
  video: HTMLVideoElement | null;
  currentTime: number;
  zoom: ZoomAnimation;
  filters: ColorFilterSettings;
  overlays: OverlayItem[];
  selectedOverlayId?: string | null;
  isExporting?: boolean;
}) {
  const width = CANVAS_WIDTH;
  const height = CANVAS_HEIGHT;

  // 1. Clear canvas with dark base
  ctx.save();
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, width, height);

  // 2. Draw Video Frame (Cover mode for 9:16 Shorts)
  if (video && video.readyState >= 2) {
    const vWidth = video.videoWidth || 1920;
    const vHeight = video.videoHeight || 1080;

    // Calculate aspect fill (cover)
    const scaleToCover = Math.max(width / vWidth, height / vHeight);
    const drawW = vWidth * scaleToCover;
    const drawH = vHeight * scaleToCover;
    const drawX = (width - drawW) / 2;
    const drawY = (height - drawH) / 2;

    // Zoom transform calculation
    const { scale: zoomScale, focusX, focusY } = calculateZoomScale(zoom, currentTime);

    ctx.save();
    // Set color filter for video
    ctx.filter = buildFilterString(filters);

    if (zoomScale !== 1.0) {
      // Zoom centered at focus point
      const pivotX = width * focusX;
      const pivotY = height * focusY;
      ctx.translate(pivotX, pivotY);
      ctx.scale(zoomScale, zoomScale);
      ctx.translate(-pivotX, -pivotY);
    }

    ctx.drawImage(video, drawX, drawY, drawW, drawH);
    ctx.restore();
  } else {
    // Placeholder grid background
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#71717a';
    ctx.font = '600 48px "Noto Sans JP", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('9:16 動画を読み込んでください', width / 2, height / 2);
    ctx.font = '400 32px sans-serif';
    ctx.fillStyle = '#52525b';
    ctx.fillText('MP4 / WebM またはサンプル動画', width / 2, height / 2 + 70);
  }

  // 3. Render Overlays (Text, Stamps, Watermarks, Images)
  for (const item of overlays) {
    // Check timing visibility
    const isVisible =
      currentTime >= item.startTime &&
      (item.endTime === -1 || currentTime <= item.endTime);

    if (!isVisible) continue;

    ctx.save();
    ctx.globalAlpha = item.opacity;

    const posX = item.x * width;
    const posY = item.y * height;

    ctx.translate(posX, posY);
    if (item.rotation !== 0) {
      ctx.rotate((item.rotation * Math.PI) / 180);
    }
    if (item.scale !== 1.0) {
      ctx.scale(item.scale, item.scale);
    }

    if (item.type === 'text') {
      renderTextOverlay(ctx, item);
    } else if (item.type === 'stamp') {
      renderStampOverlay(ctx, item);
    } else if (item.type === 'image' && item.imageElement) {
      renderImageOverlay(ctx, item);
    }

    // 4. Draw bounding box if selected (and not exporting)
    if (!isExporting && selectedOverlayId === item.id) {
      drawSelectionBox(ctx, item);
    }

    ctx.restore();
  }

  ctx.restore();
}

function renderTextOverlay(ctx: CanvasRenderingContext2D, item: OverlayItem) {
  const text = item.text || '';
  if (!text) return;

  const fontSize = item.fontSize || 56;
  const fontFamily = item.fontFamily || '"Noto Sans JP", sans-serif';
  const fontWeight = item.fontWeight || '700';

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const padding = item.backgroundPadding ?? 24;
  const boxWidth = textWidth + padding * 2;
  const boxHeight = fontSize * 1.35 + padding * 1.2;

  // Background plate if enabled
  if (item.backgroundColor && item.backgroundColor !== 'transparent') {
    ctx.fillStyle = item.backgroundColor;
    const radius = item.borderRadius ?? 16;
    drawRoundedRect(ctx, -boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, radius);
    ctx.fill();
  }

  // Text Stroke / Outline
  if (item.strokeColor && (item.strokeWidth || 0) > 0) {
    ctx.strokeStyle = item.strokeColor;
    ctx.lineWidth = item.strokeWidth || 4;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, 0, 0);
  }

  // Text Fill
  ctx.fillStyle = item.fillColor || '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;
  ctx.fillText(text, 0, 0);
}

function renderStampOverlay(ctx: CanvasRenderingContext2D, item: OverlayItem) {
  const variant = item.stampVariant || 'reprint_prohibited';
  const text = item.text || (variant === 'reprint_prohibited' ? '無断転載禁止' : 'SAMPLE');

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (variant === 'reprint_prohibited') {
    // Elegant warning stamp badge
    const badgeW = 480;
    const badgeH = 110;
    const r = 20;

    // Dark crimson gradient backdrop
    const grad = ctx.createLinearGradient(-badgeW / 2, 0, badgeW / 2, 0);
    grad.addColorStop(0, 'rgba(185, 28, 28, 0.92)');
    grad.addColorStop(1, 'rgba(127, 29, 29, 0.92)');

    ctx.fillStyle = grad;
    drawRoundedRect(ctx, -badgeW / 2, -badgeH / 2, badgeW, badgeH, r);
    ctx.fill();

    // Solid border
    ctx.strokeStyle = '#fecaca';
    ctx.lineWidth = 4;
    drawRoundedRect(ctx, -badgeW / 2, -badgeH / 2, badgeW, badgeH, r);
    ctx.stroke();

    // Icon (circle slash) on the left
    const iconX = -badgeW / 2 + 50;
    ctx.beginPath();
    ctx.arc(iconX, 0, 24, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(iconX - 17, -17);
    ctx.lineTo(iconX + 17, 17);
    ctx.stroke();

    // Stamp text
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 42px "Noto Sans JP", sans-serif';
    ctx.fillText(text, 24, -2);
  } else if (variant === 'strictly_confidential') {
    // 転載厳禁 stamp
    const badgeW = 380;
    const badgeH = 96;
    ctx.fillStyle = 'rgba(220, 38, 38, 0.88)';
    drawRoundedRect(ctx, -badgeW / 2, -badgeH / 2, badgeW, badgeH, 12);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    drawRoundedRect(ctx, -badgeW / 2 + 4, -badgeH / 2 + 4, badgeW - 8, badgeH - 8, 8);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 40px "Noto Sans JP", sans-serif';
    ctx.fillText(text, 0, 0);
  } else if (variant === 'sample') {
    // Diagonal Semi-transparent watermark stamp
    const stampW = 540;
    const stampH = 130;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 6;
    drawRoundedRect(ctx, -stampW / 2, -stampH / 2, stampW, stampH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '900 64px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(text, 0, 0);
  } else {
    // Custom Badge
    const pad = 30;
    ctx.font = '800 46px "Noto Sans JP", sans-serif';
    const m = ctx.measureText(text);
    const bw = m.width + pad * 2;
    const bh = 90;

    ctx.fillStyle = item.backgroundColor || 'rgba(0, 0, 0, 0.75)';
    drawRoundedRect(ctx, -bw / 2, -bh / 2, bw, bh, 18);
    ctx.fill();

    ctx.strokeStyle = item.strokeColor || '#fbbf24';
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, -bw / 2, -bh / 2, bw, bh, 18);
    ctx.stroke();

    ctx.fillStyle = item.fillColor || '#ffffff';
    ctx.fillText(text, 0, 0);
  }
}

function renderImageOverlay(ctx: CanvasRenderingContext2D, item: OverlayItem) {
  if (!item.imageElement) return;
  const img = item.imageElement;
  const targetW = (item.width || 0.3) * CANVAS_WIDTH;
  const targetH = (item.height || (img.height / img.width) * (item.width || 0.3)) * CANVAS_HEIGHT;

  ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
}

function drawSelectionBox(ctx: CanvasRenderingContext2D, item: OverlayItem) {
  let w = 400;
  let h = 120;

  if (item.type === 'text') {
    const fontSize = item.fontSize || 56;
    ctx.font = `${item.fontWeight || '700'} ${fontSize}px ${item.fontFamily || 'sans-serif'}`;
    const m = ctx.measureText(item.text || '');
    w = m.width + 60;
    h = fontSize * 1.5 + 40;
  } else if (item.type === 'stamp') {
    w = 520;
    h = 140;
  } else if (item.type === 'image' && item.imageElement) {
    w = (item.width || 0.3) * CANVAS_WIDTH + 30;
    h = (item.height || 0.3) * CANVAS_HEIGHT + 30;
  }

  ctx.save();
  ctx.strokeStyle = '#6366f1'; // Indigo selection
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 8]);
  drawRoundedRect(ctx, -w / 2, -h / 2, w, h, 12);
  ctx.stroke();

  // Corner control points
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 3;
  const corners = [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [w / 2, h / 2],
    [-w / 2, h / 2],
  ];
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export type OverlayType = 'text' | 'stamp' | 'image';

export interface OverlayItem {
  id: string;
  type: OverlayType;
  // Normalized coordinates (0 to 1) relative to 1080x1920 canvas
  x: number; // 0 to 1 (center X)
  y: number; // 0 to 1 (center Y)
  width?: number; // Normalized width
  height?: number; // Normalized height
  scale: number; // Scale factor (1.0 default)
  rotation: number; // Rotation in degrees
  opacity: number; // 0 to 1
  
  // Timing
  startTime: number; // In seconds
  endTime: number; // In seconds (or -1 for entire duration)
  
  // Text & Stamp specific
  text?: string;
  fontSize?: number; // Base font size (px on 1080p canvas)
  fontFamily?: string;
  fontWeight?: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  backgroundPadding?: number;
  borderRadius?: number;
  
  // Stamp presets
  stampVariant?: 'reprint_prohibited' | 'strictly_confidential' | 'sample' | 'tiktok_badge' | 'custom';
  
  // Image specific
  imageElement?: HTMLImageElement;
  imageDataUrl?: string;
}

export interface ZoomAnimation {
  enabled: boolean;
  startTime: number; // seconds
  endTime: number; // seconds
  startScale: number; // e.g. 1.0
  endScale: number; // e.g. 1.5
  focusX: number; // 0.0 to 1.0 (default 0.5)
  focusY: number; // 0.0 to 1.0 (default 0.5)
  easing: 'ease-in-out' | 'linear' | 'ease-out';
}

export interface ColorFilterSettings {
  preset: 'normal' | 'grayscale' | 'sepia' | 'contrast' | 'vivid' | 'cinematic' | 'retro' | 'cyberpunk';
  brightness: number; // 0 to 200 (100 = normal)
  contrast: number; // 0 to 200 (100 = normal)
  saturation: number; // 0 to 200 (100 = normal)
  sepia: number; // 0 to 100
  grayscale: number; // 0 to 100
  hueRotate: number; // 0 to 360 deg
  blur: number; // 0 to 10px
}

export interface VideoInfo {
  url: string;
  name: string;
  duration: number;
  width: number;
  height: number;
  hasAudio: boolean;
}

export interface VideoDiagnosticInfo {
  name: string;
  sizeMB: number;
  width: number;
  height: number;
  duration: number;
  aspectRatio: string;
  isPortrait: boolean;
  hasAudio: boolean;
  mimeType: string;
}

export interface VideoLoadState {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  fileName?: string;
  fileSize?: number;
  errorMessage?: string;
  errorDetail?: string;
  diagnostics?: VideoDiagnosticInfo;
}

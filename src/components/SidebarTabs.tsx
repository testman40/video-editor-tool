import React, { useState } from 'react';
import {
  Film,
  Type,
  Sliders,
  Download,
  Plus,
  Trash2,
  Image as ImageIcon,
  ShieldAlert,
  Sparkles,
  Upload,
  ZoomIn,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Info,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import { ColorFilterSettings, OverlayItem, ZoomAnimation, VideoLoadState } from '../types';

interface SidebarTabsProps {
  onFileUpload: (file: File) => void;
  onLoadSample: () => void;
  isLoadingSample: boolean;
  videoDuration: number;
  overlays: OverlayItem[];
  selectedOverlayId: string | null;
  onSelectOverlay: (id: string | null) => void;
  onAddText: (text: string, fontSize: number, fillColor: string, bgColor: string) => void;
  onAddStamp: (variant: 'reprint_prohibited' | 'strictly_confidential' | 'sample' | 'custom', text: string) => void;
  onAddImageStamp: (file: File) => void;
  onUpdateOverlay: (id: string, updates: Partial<OverlayItem>) => void;
  onDeleteOverlay: (id: string) => void;
  zoom: ZoomAnimation;
  onUpdateZoom: (updates: Partial<ZoomAnimation>) => void;
  filters: ColorFilterSettings;
  onUpdateFilters: (updates: Partial<ColorFilterSettings>) => void;
  onStartExport: () => void;
  hasVideo: boolean;
  onSwitchToPreview?: () => void;
  videoLoadState?: VideoLoadState;
}

export const SidebarTabs: React.FC<SidebarTabsProps> = ({
  onFileUpload,
  onLoadSample,
  isLoadingSample,
  videoDuration,
  overlays,
  selectedOverlayId,
  onSelectOverlay,
  onAddText,
  onAddStamp,
  onAddImageStamp,
  onUpdateOverlay,
  onDeleteOverlay,
  zoom,
  onUpdateZoom,
  filters,
  onUpdateFilters,
  onStartExport,
  hasVideo,
  onSwitchToPreview,
  videoLoadState,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'stamp' | 'effects' | 'export'>('stamp');

  // Custom text form state
  const [customText, setCustomText] = useState('マイチャンネル @Channel');
  const [fontSize, setFontSize] = useState(54);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textBgColor, setTextBgColor] = useState('rgba(0, 0, 0, 0.7)');

  const selectedOverlay = overlays.find((o) => o.id === selectedOverlayId);

  return (
    <aside className="w-full lg:w-[420px] bg-zinc-900 border-l border-zinc-800 flex flex-col flex-1 h-full lg:h-[calc(100vh-64px)] shrink-0 overflow-hidden">
      {/* Mobile Notice / Shortcut to Preview */}
      {onSwitchToPreview && (
        <div className="lg:hidden px-3 py-2 bg-indigo-950/50 border-b border-indigo-900/50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-indigo-300 font-medium">
            スタンプは長押しで移動、2回タップで削除可能
          </span>
          <button
            type="button"
            onClick={onSwitchToPreview}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-sm active:scale-95"
          >
            プレビュー 📹
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-800 bg-zinc-950/60 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('video')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'video'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>動画</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stamp')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'stamp'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>透かし・文字</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('effects')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'effects'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>エフェクト</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'export'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>出力</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
        {/* ===================== TAB 1: VIDEO ===================== */}
        {activeTab === 'video' && (
          <div className="space-y-5">
            {/* 1. Real-time Video Load & Diagnostic Check Card */}
            {videoLoadState && videoLoadState.status !== 'idle' && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  動画読み込みステータス・診断チェック
                </h2>

                {/* Loading State */}
                {videoLoadState.status === 'loading' && (
                  <div className="bg-indigo-950/30 border border-indigo-500/40 rounded-2xl p-4 space-y-2.5 animate-pulse">
                    <div className="flex items-center gap-2.5 text-indigo-300 font-bold text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
                      <span>動画ファイルを読み込み・解析中...</span>
                    </div>
                    <div className="text-xs text-zinc-300 space-y-1 pl-6">
                      <p className="truncate font-mono text-[11px] text-zinc-400">
                        対象: {videoLoadState.fileName || '選択された動画'}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        ブラウザのデコーダーで解像度・アスペクト比・コーデックを検証しています...
                      </p>
                    </div>
                  </div>
                )}

                {/* Error State with Troubleshooting */}
                {videoLoadState.status === 'error' && (
                  <div className="bg-rose-950/40 border border-rose-500/50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{videoLoadState.errorMessage || '動画の読み込みに失敗しました'}</span>
                    </div>

                    <p className="text-xs text-rose-200/90 leading-relaxed pl-6">
                      {videoLoadState.errorDetail || 'お使いのブラウザでこの動画形式を再生できませんでした。'}
                    </p>

                    {/* Smartphone Troubleshooting Hint */}
                    <div className="bg-zinc-950/60 rounded-xl p-3 text-[11px] text-zinc-300 space-y-1.5 border border-zinc-800">
                      <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>スマホ（iPhone / Android）での確認ポイント:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-zinc-400 text-[11px]">
                        <li>iPhoneで撮影した動画（高効率HEVC形式やHDR）はブラウザによって再生制限がかかる場合があります。</li>
                        <li>標準的なMP4（H.264形式）動画を選択するか、写真アプリの共有から保存した動画をお試しください。</li>
                        <li>動作確認として下記の「サンプル動画を生成して読込」をお試しいただけます。</li>
                      </ul>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={onLoadSample}
                        className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm active:scale-95 text-center"
                      >
                        サンプル動画で試す
                      </button>
                      <label className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition active:scale-95 text-center cursor-pointer">
                        <span>別のファイルを選択</span>
                        <input
                          type="file"
                          accept="video/*,video/mp4,video/quicktime,video/webm"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) onFileUpload(f);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Loaded Success State with Full Diagnostics */}
                {videoLoadState.status === 'loaded' && videoLoadState.diagnostics && (
                  <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>動画チェック完了: 正常に読み込まれました</span>
                      </div>
                      {onSwitchToPreview && (
                        <button
                          type="button"
                          onClick={onSwitchToPreview}
                          className="lg:hidden text-[11px] text-indigo-400 hover:text-indigo-300 font-bold underline"
                        >
                          プレビューへ 📹
                        </button>
                      )}
                    </div>

                    {/* Diagnostic Key-Value Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/80">
                      <div>
                        <span className="text-zinc-500 text-[10px] block">ファイル名</span>
                        <span className="font-medium text-zinc-200 truncate block max-w-[150px]" title={videoLoadState.diagnostics.name}>
                          {videoLoadState.diagnostics.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[10px] block">ファイル容量</span>
                        <span className="font-mono text-zinc-300">
                          {videoLoadState.diagnostics.sizeMB > 0 ? `${videoLoadState.diagnostics.sizeMB} MB` : '自動生成'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[10px] block">解像度 (WxH)</span>
                        <span className="font-mono font-semibold text-zinc-200">
                          {videoLoadState.diagnostics.width} × {videoLoadState.diagnostics.height} px
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[10px] block">再生時間</span>
                        <span className="font-mono text-zinc-200">
                          {Math.floor(videoLoadState.diagnostics.duration / 60)}分
                          {(videoLoadState.diagnostics.duration % 60).toFixed(1)}秒
                        </span>
                      </div>
                    </div>

                    {/* Aspect Ratio Assessment */}
                    <div className="text-xs">
                      {videoLoadState.diagnostics.isPortrait ? (
                        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium">
                          <Smartphone className="w-3.5 h-3.5 shrink-0" />
                          <span>9:16 縦長動画として最適です（YouTube Shorts / TikTokにそのまま対応）</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span>横長動画です。9:16キャンバス中央にフィット配置中（「エフェクト」タブで拡大・クロップ可能）</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. File Upload Dropzone */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                動画ファイルの読み込み
              </h2>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 hover:border-indigo-500 bg-zinc-950/40 hover:bg-zinc-950/80 rounded-2xl p-6 cursor-pointer transition text-center group">
                <div className="w-12 h-12 rounded-full bg-zinc-800 group-hover:bg-indigo-600/20 text-zinc-400 group-hover:text-indigo-400 flex items-center justify-center mb-3 transition">
                  <Film className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-zinc-200 mb-1">
                  動画ファイルをタップまたはドロップ
                </span>
                <span className="text-xs text-zinc-500">
                  MP4 / WebM / QuickTime (9:16 縦長動画推奨)
                </span>
                <input
                  type="file"
                  accept="video/*,video/mp4,video/quicktime,video/webm"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFileUpload(f);
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* 3. Sample Generator */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                テスト用 9:16 サンプル動画
              </h2>
              <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  端末に動画ファイルがない場合でも、ブラウザ標準のWeb Audio APIとCanvasで音声付き9:16アニメーション動画を即座に生成してテストできます。
                </p>
                <button
                  type="button"
                  onClick={onLoadSample}
                  disabled={isLoadingSample}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{isLoadingSample ? 'サンプルを生成中...' : 'サンプル動画を生成して読込'}</span>
                </button>
              </div>
            </div>

            <div className="bg-zinc-950/30 border border-zinc-800/80 rounded-xl p-3.5 text-xs text-zinc-400 space-y-1">
              <div className="font-semibold text-zinc-300">💡 9:16 動画編集のポイント:</div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-zinc-400">
                <li>横長(16:9)の動画でも、自動的に縦長フレームいっぱいに中央配置されます。</li>
                <li>「エフェクト」タブで動画全体のズームイン演出や色調調整が可能です。</li>
              </ul>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: WATERMARKS & STAMPS ===================== */}
        {activeTab === 'stamp' && (
          <div className="space-y-6">
            {/* Quick Stamp Presets */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                ワンクリック透かしスタンプ
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onAddStamp('reprint_prohibited', '無断転載禁止')}
                  className="flex items-center gap-2 p-3 bg-red-950/40 hover:bg-red-900/40 border border-red-800/50 hover:border-red-600 rounded-xl text-left transition group active:scale-95"
                >
                  <span className="text-lg">🚫</span>
                  <div>
                    <div className="text-xs font-bold text-red-200 group-hover:text-white">無断転載禁止</div>
                    <div className="text-[10px] text-red-400/80">赤警告バッジ</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onAddStamp('strictly_confidential', '転載厳禁')}
                  className="flex items-center gap-2 p-3 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/50 hover:border-rose-600 rounded-xl text-left transition group active:scale-95"
                >
                  <span className="text-lg">⚠️</span>
                  <div>
                    <div className="text-xs font-bold text-rose-200 group-hover:text-white">転載厳禁</div>
                    <div className="text-[10px] text-rose-400/80">枠線シール風</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onAddStamp('sample', 'SAMPLE')}
                  className="flex items-center gap-2 p-3 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded-xl text-left transition group active:scale-95"
                >
                  <span className="text-lg">🔒</span>
                  <div>
                    <div className="text-xs font-bold text-zinc-200 group-hover:text-white">SAMPLE</div>
                    <div className="text-[10px] text-zinc-400">半透明透かし</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onAddStamp('custom', '⭐️ Shorts / TikTok')}
                  className="flex items-center gap-2 p-3 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-800/50 hover:border-indigo-600 rounded-xl text-left transition group active:scale-95"
                >
                  <span className="text-lg">📱</span>
                  <div>
                    <div className="text-xs font-bold text-indigo-200 group-hover:text-white">Shortsバッジ</div>
                    <div className="text-[10px] text-indigo-400/80">ゴールド枠</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Text Overlay Creator */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-indigo-400" />
                カスタムテキストの挿入
              </h2>
              <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">表示文字列</label>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="例: 無断転載禁止 / @username"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">文字色</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-9 h-9 rounded-lg border border-zinc-700 bg-transparent cursor-pointer p-0.5"
                      />
                      <span className="text-xs font-mono text-zinc-400">{textColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">フォントサイズ (px)</label>
                    <input
                      type="number"
                      min={24}
                      max={140}
                      step={2}
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value, 10) || 54)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-sm text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">背景プレート</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTextBgColor('transparent')}
                      className={`px-3 py-1 text-xs rounded-lg border ${
                        textBgColor === 'transparent'
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      なし (透明)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextBgColor('rgba(0, 0, 0, 0.75)')}
                      className={`px-3 py-1 text-xs rounded-lg border ${
                        textBgColor.includes('0, 0, 0')
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      黒半透明
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextBgColor('rgba(220, 38, 38, 0.85)')}
                      className={`px-3 py-1 text-xs rounded-lg border ${
                        textBgColor.includes('220')
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      赤プレート
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onAddText(customText, fontSize, textColor, textBgColor)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>テキストを動画に配置</span>
                </button>
              </div>
            </div>

            {/* Logo Image Watermark */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                画像ロゴ / 透かしアイコン
              </h2>
              <label className="flex items-center justify-center gap-2 border border-zinc-700 hover:border-indigo-500 bg-zinc-950/40 rounded-xl p-3.5 cursor-pointer text-xs font-semibold text-zinc-300 transition group">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>PNG / JPEG ロゴ画像をアップロード</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onAddImageStamp(f);
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Active Overlays Inspector */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  配置中アイテム ({overlays.length})
                </h2>
                <span className="text-[11px] text-zinc-500">ドラッグで直接移動可</span>
              </div>

              {overlays.length === 0 ? (
                <div className="text-center py-6 border border-zinc-800/80 rounded-2xl bg-zinc-950/20 text-xs text-zinc-500">
                  スタンプまたはテキストを追加してください
                </div>
              ) : (
                <div className="space-y-2">
                  {overlays.map((item) => {
                    const isSelected = item.id === selectedOverlayId;
                    return (
                      <div
                        key={item.id}
                        onClick={() => onSelectOverlay(item.id)}
                        className={`p-3 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-950/30 border-indigo-500/80 ring-1 ring-indigo-500/50'
                            : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                            <span className="text-xs font-bold text-zinc-200 truncate">
                              {item.text || '画像スタンプ'}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
                              {item.type}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteOverlay(item.id);
                            }}
                            className="text-zinc-500 hover:text-rose-400 p-1 transition"
                            title="削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {isSelected && (
                          <div
                            className="pt-2 mt-2 border-t border-zinc-800/80 space-y-2.5 text-xs text-zinc-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] text-zinc-400 mb-1">
                                  不透明度 ({Math.round(item.opacity * 100)}%)
                                </label>
                                <input
                                  type="range"
                                  min={0.1}
                                  max={1}
                                  step={0.05}
                                  value={item.opacity}
                                  onChange={(e) =>
                                    onUpdateOverlay(item.id, { opacity: parseFloat(e.target.value) })
                                  }
                                  className="w-full h-1.5 bg-zinc-800 rounded appearance-none accent-indigo-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] text-zinc-400 mb-1">
                                  サイズ倍率 ({item.scale.toFixed(1)}x)
                                </label>
                                <input
                                  type="range"
                                  min={0.5}
                                  max={2.5}
                                  step={0.1}
                                  value={item.scale}
                                  onChange={(e) =>
                                    onUpdateOverlay(item.id, { scale: parseFloat(e.target.value) })
                                  }
                                  className="w-full h-1.5 bg-zinc-800 rounded appearance-none accent-indigo-500"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] text-zinc-400 mb-1">
                                  回転 ({item.rotation}°)
                                </label>
                                <input
                                  type="range"
                                  min={-180}
                                  max={180}
                                  step={5}
                                  value={item.rotation}
                                  onChange={(e) =>
                                    onUpdateOverlay(item.id, { rotation: parseInt(e.target.value, 10) })
                                  }
                                  className="w-full h-1.5 bg-zinc-800 rounded appearance-none accent-indigo-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] text-zinc-400 mb-1">表示時間</label>
                                <select
                                  value={item.endTime === -1 ? 'all' : 'range'}
                                  onChange={(e) =>
                                    onUpdateOverlay(item.id, {
                                      endTime: e.target.value === 'all' ? -1 : Math.min(videoDuration, 3),
                                    })
                                  }
                                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200"
                                >
                                  <option value="all">常時表示 (全体)</option>
                                  <option value="range">先頭のみ (0s〜3s)</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 3: EFFECTS & ANIMATION ===================== */}
        {activeTab === 'effects' && (
          <div className="space-y-6">
            {/* Zoom Animation Card */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-indigo-400" />
                  ズームイン / アウト アニメーション
                </h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={zoom.enabled}
                    onChange={(e) => onUpdateZoom({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className={`bg-zinc-950/40 border border-zinc-800 rounded-2xl p-4 space-y-4 transition ${!zoom.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Quick Presets */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateZoom({
                        startScale: 1.0,
                        endScale: 1.6,
                        startTime: 0.5,
                        endTime: Math.min(videoDuration || 4, 3.5),
                        easing: 'ease-in-out',
                      })
                    }
                    className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 text-center transition active:scale-95"
                  >
                    🔍 ズームイン (1.0x → 1.6x)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateZoom({
                        startScale: 1.6,
                        endScale: 1.0,
                        startTime: 0.5,
                        endTime: Math.min(videoDuration || 4, 3.5),
                        easing: 'ease-in-out',
                      })
                    }
                    className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 text-center transition active:scale-95"
                  >
                    🔎 ズームアウト (1.6x → 1.0x)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      開始時間: {zoom.startTime.toFixed(1)}s
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={videoDuration > 0 ? videoDuration : 10}
                      step={0.2}
                      value={zoom.startTime}
                      onChange={(e) => onUpdateZoom({ startTime: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-800 rounded appearance-none accent-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      終了時間: {zoom.endTime.toFixed(1)}s
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={videoDuration > 0 ? videoDuration : 10}
                      step={0.2}
                      value={zoom.endTime}
                      onChange={(e) => onUpdateZoom({ endTime: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-800 rounded appearance-none accent-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      開始倍率: {zoom.startScale.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={3.0}
                      step={0.1}
                      value={zoom.startScale}
                      onChange={(e) => onUpdateZoom({ startScale: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-800 rounded appearance-none accent-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      終了倍率: {zoom.endScale.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={3.0}
                      step={0.1}
                      value={zoom.endScale}
                      onChange={(e) => onUpdateZoom({ endScale: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-800 rounded appearance-none accent-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    イージング曲線
                  </label>
                  <select
                    value={zoom.easing}
                    onChange={(e) =>
                      onUpdateZoom({ easing: e.target.value as 'ease-in-out' | 'linear' | 'ease-out' })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200"
                  >
                    <option value="ease-in-out">なめらか (Ease In-Out)</option>
                    <option value="ease-out">減速 (Ease Out)</option>
                    <option value="linear">直線 (Linear)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Color Filters Card */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  色調調整 (フィルター)
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateFilters({
                      preset: 'normal',
                      brightness: 100,
                      contrast: 100,
                      saturation: 100,
                      grayscale: 0,
                      sepia: 0,
                      hueRotate: 0,
                      blur: 0,
                    })
                  }
                  className="text-[11px] text-zinc-400 hover:text-indigo-400 transition"
                >
                  リセット
                </button>
              </div>

              {/* Filter Presets Grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { id: 'normal', label: 'ノーマル', b: 100, c: 100, s: 100, g: 0, sp: 0 },
                  { id: 'grayscale', label: 'モノクロ', b: 100, c: 115, s: 0, g: 100, sp: 0 },
                  { id: 'sepia', label: 'セピア', b: 95, c: 110, s: 80, g: 0, sp: 85 },
                  { id: 'contrast', label: '高コントラスト', b: 105, c: 150, s: 115, g: 0, sp: 0 },
                  { id: 'vivid', label: 'ビビッド', b: 105, c: 120, s: 160, g: 0, sp: 0 },
                  { id: 'cinematic', label: 'シネマティック', b: 95, c: 125, s: 85, g: 0, sp: 25 },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      onUpdateFilters({
                        preset: item.id as any,
                        brightness: item.b,
                        contrast: item.c,
                        saturation: item.s,
                        grayscale: item.g,
                        sepia: item.sp,
                      })
                    }
                    className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition active:scale-95 ${
                      filters.preset === item.id
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-zinc-950/40 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Sliders */}
              <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-4 space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1">
                    <span>明るさ (Brightness)</span>
                    <span className="font-mono text-zinc-400">{filters.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={160}
                    value={filters.brightness}
                    onChange={(e) => onUpdateFilters({ brightness: parseInt(e.target.value, 10) })}
                    className="w-full h-1.5 bg-zinc-800 rounded appearance-none accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1">
                    <span>コントラスト (Contrast)</span>
                    <span className="font-mono text-zinc-400">{filters.contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    value={filters.contrast}
                    onChange={(e) => onUpdateFilters({ contrast: parseInt(e.target.value, 10) })}
                    className="w-full h-1.5 bg-zinc-800 rounded appearance-none accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1">
                    <span>彩度 (Saturation)</span>
                    <span className="font-mono text-zinc-400">{filters.saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={filters.saturation}
                    onChange={(e) => onUpdateFilters({ saturation: parseInt(e.target.value, 10) })}
                    className="w-full h-1.5 bg-zinc-800 rounded appearance-none accent-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: EXPORT ===================== */}
        {activeTab === 'export' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                9:16 Shorts 動画の書き出し
              </h2>
              <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  HTML5 CanvasとMediaRecorder APIを使用し、透かし、テキスト、ズームアニメーション、色調フィルター、および元動画の音声を合成してローカルにダウンロード保存します。
                </p>

                <div className="space-y-3 pt-2 border-t border-zinc-800">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">出力解像度</label>
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-zinc-200">1080 x 1920 (フルHD 9:16)</div>
                        <div className="text-[10px] text-zinc-400">YouTube Shorts / TikTok 推奨規格</div>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                        標準
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">出力フォーマット</label>
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-zinc-200">MP4 (H.264 / AAC)</div>
                        <div className="text-[10px] text-zinc-400">ブラウザネイティブ MediaRecorder合成</div>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                        .mp4
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onStartExport}
                  disabled={!hasVideo}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed mt-4"
                >
                  <Download className="w-4 h-4" />
                  <span>MP4動画を書き出して保存</span>
                </button>
              </div>
            </div>

            <div className="bg-zinc-950/30 border border-zinc-800/80 rounded-xl p-3.5 text-[11px] text-zinc-400 space-y-1">
              <div className="font-semibold text-zinc-300">💡 書き出しに関するブラウザ仕様:</div>
              <p>
                MediaRecorder APIはブラウザのサポート状況に応じて自動的に最適なコーデック（H.264またはVP9/VP8）を選択し、.mp4ファイルとして出力します。
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

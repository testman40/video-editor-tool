import React from 'react';
import { Download, Film, Sparkles, Code2 } from 'lucide-react';

interface HeaderProps {
  onLoadSample: () => void;
  onOpenExport: () => void;
  onOpenStandaloneModal: () => void;
  isLoadingSample: boolean;
  hasVideo: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSample,
  onOpenExport,
  onOpenStandaloneModal,
  isLoadingSample,
  hasVideo,
}) => {
  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-500 shadow-md shadow-indigo-500/20 text-white">
          <Film className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight">
              Shorts 9:16 Video Editor
            </h1>
            <span className="hidden sm:inline-flex px-2 py-0.5 text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-full">
              9:16 縦長動画
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 hidden sm:block">
            YouTube Shorts / TikTok向け透かし・アニメーション・MP4書き出し
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onLoadSample}
          disabled={isLoadingSample}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition active:scale-95 disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isLoadingSample ? 'animate-spin' : ''}`} />
          <span>{isLoadingSample ? '生成中...' : 'サンプル動画'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenStandaloneModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition active:scale-95"
          title="単一HTMLファイル（In-lined CSS/JS）のコード表示・保存"
        >
          <Code2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">単一HTMLコード</span>
          <span className="md:hidden">HTML</span>
        </button>

        <button
          type="button"
          onClick={onOpenExport}
          disabled={!hasVideo}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" />
          <span>MP4書き出し</span>
        </button>
      </div>
    </header>
  );
};

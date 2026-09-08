import React from 'react';
import { Download, Film, Sparkles, Code2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { VideoLoadState } from '../types';

interface HeaderProps {
  onLoadSample: () => void;
  onOpenExport: () => void;
  onOpenStandaloneModal: () => void;
  isLoadingSample: boolean;
  hasVideo: boolean;
  videoLoadState?: VideoLoadState;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSample,
  onOpenExport,
  onOpenStandaloneModal,
  isLoadingSample,
  hasVideo,
  videoLoadState,
}) => {
  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur px-3 sm:px-6 flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-500 shadow-md shadow-indigo-500/20 text-white shrink-0">
          <Film className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-xs sm:text-base font-bold text-zinc-100 tracking-tight">
              Shorts 9:16 Editor
            </h1>
            {videoLoadState?.status === 'loading' && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                <span>解析中</span>
              </span>
            )}
            {videoLoadState?.status === 'error' && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full flex items-center gap-1 animate-pulse">
                <AlertCircle className="w-2.5 h-2.5" />
                <span>エラー</span>
              </span>
            )}
            {videoLoadState?.status === 'loaded' && (
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>準備完了</span>
              </span>
            )}
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
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition active:scale-95 disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isLoadingSample ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isLoadingSample ? '生成中...' : 'サンプル動画'}</span>
          <span className="sm:hidden">{isLoadingSample ? '...' : 'サンプル'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenStandaloneModal}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition active:scale-95"
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
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">MP4書き出し</span>
          <span className="sm:hidden">書き出し</span>
        </button>
      </div>
    </header>
  );
};

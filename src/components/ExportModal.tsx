import React from 'react';
import { Download, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { ExportProgress } from '../utils/exportVideo';

interface ExportModalProps {
  isOpen: boolean;
  progress: ExportProgress | null;
  result: { downloadUrl: string; filename: string } | null;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  progress,
  result,
  onClose,
}) => {
  if (!isOpen) return null;

  const isCompleted = progress?.status === 'completed' && result;
  const isError = progress?.status === 'error';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative text-center">
        {/* Close Button if completed or error */}
        {(isCompleted || isError) && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* State Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
          {isCompleted ? (
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
          ) : isError ? (
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-zinc-100 mb-1">
          {isCompleted
            ? '🎉 9:16 動画の書き出しが完了しました'
            : isError
            ? '書き出しエラー'
            : '🎬 動画を書き出し処理中...'}
        </h2>

        {/* Subtitle */}
        <p className="text-xs text-zinc-400 mb-5">
          {isCompleted
            ? 'Shorts / TikTok向けに最適化された動画が完成しました。'
            : isError
            ? progress?.errorMessage || '書き出し処理中にエラーが発生しました。'
            : 'キャンバス映像・音声トラックをMediaRecorderで合成しています'}
        </p>

        {/* Progress Bar */}
        {!isCompleted && !isError && (
          <div className="space-y-2 mb-6">
            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-150"
                style={{ width: `${progress?.progress || 0}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs font-mono text-zinc-400">
              <span>処理中: {progress?.progress || 0}%</span>
              <span>
                {progress?.currentTime.toFixed(1)}s / {progress?.totalDuration.toFixed(1)}s
              </span>
            </div>
          </div>
        )}

        {/* Video Preview on Completion */}
        {isCompleted && result && (
          <div className="mb-6 space-y-4">
            <div className="relative aspect-[9/16] max-h-56 mx-auto bg-black rounded-xl overflow-hidden border border-zinc-700 shadow-md">
              <video
                src={result.downloadUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            <a
              href={result.downloadUrl}
              download={result.filename}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>動画をダウンロード保存 ({result.filename})</span>
            </a>
          </div>
        )}

        {/* Close or Retry */}
        {(isCompleted || isError) && (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
          >
            エディタに戻る
          </button>
        )}
      </div>
    </div>
  );
};

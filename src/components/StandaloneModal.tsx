import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, ExternalLink, X, Code2 } from 'lucide-react';
import { getStandaloneHtmlContent } from '../utils/standaloneHtmlString';

interface StandaloneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StandaloneModal: React.FC<StandaloneModalProps> = ({ isOpen, onClose }) => {
  const [code, setCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getStandaloneHtmlContent()
        .then((txt) => {
          setCode(txt);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shorts_video_editor_standalone.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-100">
                単一HTMLファイル（In-lined CSS / JS）
              </h2>
              <p className="text-xs text-zinc-400">
                外部依存なし。コピーまたは保存してそのままダブルクリックで開けます
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-3 shrink-0">
          <div className="text-xs text-zinc-400">
            {code.length > 0 ? `${(code.length / 1024).toFixed(1)} KB` : ''} (HTML5 Canvas + MediaRecorder)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'コピー完了！' : 'コードをコピー'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-zinc-300" />
              <span>.html ファイルを保存</span>
            </button>

            <a
              href="/standalone.html"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-300" />
              <span>別タブで開く</span>
            </a>
          </div>
        </div>

        {/* Code Content Container */}
        <div className="flex-1 min-h-0 bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 overflow-auto font-mono text-xs text-zinc-300 select-all leading-relaxed">
          {isLoading ? (
            <div className="text-center py-12 text-zinc-500">コードを読み込んでいます...</div>
          ) : (
            <pre className="whitespace-pre-wrap break-all">{code}</pre>
          )}
        </div>
      </div>
    </div>
  );
};

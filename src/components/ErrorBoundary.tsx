import React, { useState, useEffect, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error || new Error(event.message || 'Error occurred'));
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      setError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 p-4 font-sans">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-zinc-100">画面の読み込みでエラーが発生しました</h2>
          <p className="text-xs text-zinc-400 leading-relaxed break-words bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
            {error.message || '予期せぬエラーが発生しました'}
          </p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>再読み込み</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

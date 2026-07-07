export function LoadingState({ message = "正在加载..." }: { message?: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card" role="status">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
      <p className="mt-4 text-sm font-medium text-slate-700">{message}</p>
      <p className="mt-1 text-xs text-slate-400">通常只需几秒钟</p>
    </div>
  );
}


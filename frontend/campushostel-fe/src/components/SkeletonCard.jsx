export function SkeletonCard() {
  return (
    <div className="card flex h-full animate-pulse flex-col overflow-hidden">
      <div className="aspect-[4/3] bg-slate-200"></div>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="h-4 w-3/4 rounded-full bg-slate-200"></div>
        <div className="h-3 w-1/2 rounded-full bg-slate-200"></div>
        <div className="h-3 w-1/3 rounded-full bg-slate-200"></div>
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-6 shadow-float">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-teal border-t-transparent"></div>
      </div>
    </div>
  );
}

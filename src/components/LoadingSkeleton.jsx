export function PredictionSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="w-24 h-4 bg-slate-200 rounded"></div>
        <div className="w-16 h-4 bg-slate-200 rounded"></div>
      </div>
      <div className="p-4 flex items-center justify-between">
        <div className="flex flex-col items-center gap-2 w-1/3">
          <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
          <div className="w-20 h-4 bg-slate-200 rounded"></div>
        </div>
        <div className="flex flex-col items-center justify-center w-1/3">
          <div className="w-8 h-4 bg-slate-200 rounded mb-1"></div>
          <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
        </div>
        <div className="flex flex-col items-center gap-2 w-1/3">
          <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
          <div className="w-20 h-4 bg-slate-200 rounded"></div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 h-32"></div>
      </div>
    </div>
  );
}

export function MatchSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
        <div className="w-24 h-4 bg-slate-200 rounded"></div>
        <div className="w-16 h-4 bg-slate-200 rounded"></div>
      </div>
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
          <div className="w-24 h-4 bg-slate-200 rounded"></div>
        </div>
        <div className="w-16 h-6 bg-slate-200 rounded px-4"></div>
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="w-24 h-4 bg-slate-200 rounded"></div>
          <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

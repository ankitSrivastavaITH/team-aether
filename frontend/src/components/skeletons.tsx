export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-600 rounded mb-3" />
      <div className="h-8 w-32 bg-slate-200 dark:bg-slate-600 rounded" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
      <div className="h-10 bg-slate-100 dark:bg-slate-700 border-b" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-600 rounded" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-600 rounded" />
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-600 rounded" />
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-600 rounded flex-1" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
      <div className="h-5 w-40 bg-slate-200 dark:bg-slate-600 rounded mb-4" />
      <div className="h-[300px] bg-slate-100 dark:bg-slate-700 rounded-lg flex items-end gap-2 px-4 pb-4">
        {[40, 65, 30, 80, 55, 70, 45, 60].map((h, i) => (
          <div key={i} className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function StatChipsSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      {[80, 100, 60].map((w, i) => (
        <div key={i} className="h-8 bg-slate-200 dark:bg-slate-600 rounded-full" style={{ width: w }} />
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-8 w-64 bg-slate-200 dark:bg-slate-600 rounded" />
      <div className="h-4 w-96 bg-slate-100 dark:bg-slate-700 rounded" />
    </div>
  );
}

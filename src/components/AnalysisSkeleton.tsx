interface AnalysisSkeletonProps {
  isDark?: boolean;
}

export function AnalysisSkeleton({ isDark = true }: AnalysisSkeletonProps) {
  const shimmer = isDark ? 'bg-slate-800' : 'bg-slate-200';
  const cardBg = isDark ? 'bg-slate-900' : 'bg-white';
  const cardBorder = isDark ? 'border-slate-800' : 'border-slate-200';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className={`md:col-span-5 rounded-2xl p-8 border ${cardBg} ${cardBorder}`}>
          <div className="flex flex-col items-center">
            <div className={`w-48 h-48 rounded-full ${shimmer} animate-pulse`} />
            <div className={`mt-4 h-6 w-24 rounded-lg ${shimmer} animate-pulse`} />
            <div className={`mt-2 h-5 w-20 rounded ${shimmer} animate-pulse`} />
          </div>
        </div>
        <div className="md:col-span-7 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`rounded-2xl p-6 border ${cardBg} ${cardBorder}`}>
              <div className={`h-4 w-32 rounded mb-3 ${shimmer} animate-pulse`} />
              <div className={`h-3 rounded ${shimmer} animate-pulse mb-2`} />
              <div className={`h-3 rounded w-4/5 ${shimmer} animate-pulse`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-6 sm:space-y-8">
          {/* Header skeleton */}
          <div className="h-6 sm:h-8 bg-slate-700/50 rounded w-1/3 sm:w-1/4 animate-pulse"></div>
          
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-700/50 rounded-xl p-4 sm:p-6 h-28 sm:h-32 animate-pulse"></div>
            ))}
          </div>
          
          {/* Content skeleton */}
          <div className="bg-slate-700/50 rounded-xl p-4 sm:p-6 h-48 sm:h-64 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}


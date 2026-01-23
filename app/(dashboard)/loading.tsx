export default function DashboardLoading() {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-8">
          {/* Header skeleton */}
          <div className="h-8 bg-slate-700 rounded w-1/4"></div>
          
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-700 rounded-xl p-6 h-32"></div>
            ))}
          </div>
          
          {/* Content skeleton */}
          <div className="bg-slate-700 rounded-xl p-6 h-64"></div>
        </div>
      </div>
    </div>
  )
}


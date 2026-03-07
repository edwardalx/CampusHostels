
export  function SkeletonCard() {
  return (
    <div>
      <div className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse flex flex-col h-full">
        <div className="aspect-video sm:aspect-square bg-gray-300"></div>
        <div className="p-4 sm:p-5 space-y-3">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/3"></div>
        </div>
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-teal-900/70  flex items-center justify-center z-50">
      <div className="bg-teal-800 p-6 rounded-xl shadow-lg flex flex-col items-center gap-4">
        <div className="animate-spin h-10 w-10 border-4 border-teal-400 border-t-transparent rounded-full"></div>
        {/* <p className="text-gray-200 font-medium">Loading payment details...</p> */}
      </div>
    </div>
  );
}

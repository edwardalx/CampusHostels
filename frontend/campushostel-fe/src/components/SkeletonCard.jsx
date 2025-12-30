
export default function SkeletonCard() {
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
      ;
    </div>
  );
}

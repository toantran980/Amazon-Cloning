interface ProductGridSkeletonProps {
  count?: number;
}

// Placeholder cards shown while a server-side search is in flight. Mirrors the
// ProductCard layout so the grid doesn't jump when results arrive.
export default function ProductGridSkeleton({ count = 10 }: ProductGridSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className="grid"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="pt-[40px] pb-[25px] px-[25px] border-r border-b border-[#e7e7e7] animate-pulse"
        >
          <div className="h-[180px] mb-[20px] rounded bg-[#e5e7eb]" />
          <div className="h-[16px] mb-[10px] rounded bg-[#e5e7eb] w-3/4" />
          <div className="h-[14px] mb-[10px] rounded bg-[#e5e7eb] w-1/2" />
          <div className="h-[14px] mb-[17px] rounded bg-[#e5e7eb] w-1/3" />
          <div className="h-[32px] rounded-[50px] bg-[#e5e7eb]" />
        </div>
      ))}
    </div>
  );
}
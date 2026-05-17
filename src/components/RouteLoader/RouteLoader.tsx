export default function RouteLoader() {
  return (
    <div className="min-h-screen bg-[#f7f7f7] px-6 py-10">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="mb-6 h-10 w-72 rounded-md bg-[#e8e8e8]" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-[#e2e2e2] bg-white p-4">
              <div className="mb-4 h-40 rounded bg-[#efefef]" />
              <div className="mb-2 h-4 w-full rounded bg-[#efefef]" />
              <div className="mb-4 h-4 w-2/3 rounded bg-[#efefef]" />
              <div className="h-9 w-full rounded-full bg-[#f3f3f3]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
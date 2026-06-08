export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-10 animate-pulse">
        {/* Hero skeleton */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-28 w-28 rounded-full bg-muted" />
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
          <div className="h-16 w-full max-w-md rounded bg-muted" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted" />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-muted" />
          ))}
        </div>
      </div>
    </main>
  );
}

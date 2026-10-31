export function Skeleton({ height = 16, width = "100%", radius }) {
  return <div className="skeleton" style={{ height, width, borderRadius: radius }} aria-hidden="true" />;
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="stack" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <div className="stack-sm">
            <Skeleton height={150} radius="12px" />
            <Skeleton height={18} width="85%" />
            <Skeleton height={14} width="55%" />
          </div>
        </div>
      ))}
    </div>
  );
}

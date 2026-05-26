type StarRatingProps = {
  rating: number | null | undefined;
  reviewCount: number | null | undefined;
  showCount?: boolean;
  size?: 'sm' | 'md';
};

const STAR_PATH =
  'M10 1.5l2.6 5.3 5.9.86-4.27 4.16 1 5.86L10 14.92l-5.23 2.76 1-5.86L1.5 7.66l5.9-.86z';

function Star({ fill, sizeClass }: { fill: number; sizeClass: string }) {
  const pct = `${Math.max(0, Math.min(1, fill)) * 100}%`;
  return (
    <span className={`relative inline-block ${sizeClass}`}>
      <svg
        viewBox="0 0 20 20"
        className={`absolute inset-0 ${sizeClass} text-slate-200`}
        aria-hidden="true"
        focusable="false"
      >
        <path d={STAR_PATH} fill="currentColor" />
      </svg>
      <span
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: pct }}
      >
        <svg
          viewBox="0 0 20 20"
          className={`${sizeClass} text-amber-400`}
          aria-hidden="true"
          focusable="false"
        >
          <path d={STAR_PATH} fill="currentColor" />
        </svg>
      </span>
    </span>
  );
}

export function StarRating({ rating, reviewCount, showCount = true, size = 'sm' }: StarRatingProps) {
  const r = typeof rating === 'number' && Number.isFinite(rating) ? rating : 0;
  const count = typeof reviewCount === 'number' ? reviewCount : 0;
  const sizeClass = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  const textClass = size === 'md' ? 'text-base' : 'text-sm';

  return (
    <div className={`flex items-center gap-1.5 ${textClass} text-slate-700`}>
      <span className="flex items-center gap-0.5" aria-label={`Rated ${r.toFixed(1)} out of 5`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} fill={r - i} sizeClass={sizeClass} />
        ))}
      </span>
      {r > 0 && <span className="font-semibold text-slate-900">{r.toFixed(1)}</span>}
      {showCount && (
        <span className="text-slate-500">
          ({count.toLocaleString()} {count === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}

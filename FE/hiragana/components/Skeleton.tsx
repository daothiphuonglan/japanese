'use client';

/**
 * Skeleton Loading Components — hiển thị khi data đang fetch,
 * tránh blank page/layout shift.
 */

/** Skeleton cho bảng Kana (grid 5 cột × 10 hàng) */
export function KanaSkeleton() {
  return (
    <div className="grid grid-cols-5 gap-3 md:gap-4 max-w-3xl mx-auto">
      {Array.from({ length: 46 }).map((_, i) => (
        <div
          key={i}
          className="h-16 md:h-20 rounded-xl bg-gray-200/10 animate-pulse"
          style={{ animationDelay: `${(i % 5) * 100}ms` }}
        />
      ))}
    </div>
  );
}

/** Skeleton cho card nội dung */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-gray-200/10 animate-pulse p-6 space-y-3"
          style={{ animationDelay: `${i * 150}ms` }}
        >
          {/* Title skeleton */}
          <div className="h-5 w-1/3 rounded bg-gray-300/10" />
          {/* Body skeleton */}
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-gray-300/10" />
            <div className="h-3 w-4/5 rounded bg-gray-300/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Inline spinner nhỏ — dùng trong button */
export function Spinner({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

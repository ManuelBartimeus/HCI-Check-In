import { clsx } from 'clsx';

/**
 * Skeleton loader — shimmering placeholder for loading states.
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={clsx('skeleton', className)}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * A card-shaped skeleton with configurable lines.
 */
export function SkeletonCard({ lines = 3, className }) {
  return (
    <div className={clsx('card p-5 space-y-3', className)}>
      <Skeleton className="h-4 w-2/3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

/**
 * Table row skeleton.
 */
export function SkeletonRow({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3 border-b border-hairline-soft">
          <Skeleton className="h-3 rounded" style={{ width: `${60 + (i % 3) * 20}%` }} />
        </td>
      ))}
    </tr>
  );
}

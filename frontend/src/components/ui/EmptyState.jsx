import { clsx } from 'clsx';

/**
 * Empty state placeholder — shown when a list has no items.
 */
export default function EmptyState({
  icon: Icon,
  title = 'Nothing here yet',
  description,
  action,
  className,
}) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-hairline flex items-center justify-center mb-4">
          <Icon size={24} className="text-ink-muted" />
        </div>
      )}
      <h3 className="text-[15px] font-medium text-ink mb-1">{title}</h3>
      {description && (
        <p className="text-[13px] text-ink-muted max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

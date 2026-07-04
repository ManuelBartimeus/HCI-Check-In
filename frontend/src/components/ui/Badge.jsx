import { clsx } from 'clsx';

const variants = {
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  info: 'badge-info',
  neutral: 'badge-neutral',
  violet: 'badge-violet',
};

/**
 * Status badge component.
 */
export default function Badge({ variant = 'neutral', children, className }) {
  return (
    <span className={clsx('badge', variants[variant], className)}>
      {children}
    </span>
  );
}

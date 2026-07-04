import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

/**
 * Format an ISO date string to a readable date.
 */
export function formatDate(isoString, fmt = 'MMM d, yyyy') {
  if (!isoString) return '—';
  try {
    const d = typeof isoString === 'string' ? parseISO(isoString) : isoString;
    return isValid(d) ? format(d, fmt) : '—';
  } catch {
    return '—';
  }
}

/**
 * Format an ISO datetime string to a readable date + time.
 */
export function formatDateTime(isoString) {
  return formatDate(isoString, 'MMM d, yyyy · h:mm a');
}

/**
 * Relative time: "3 hours ago"
 */
export function timeAgo(isoString) {
  if (!isoString) return '—';
  try {
    const d = typeof isoString === 'string' ? parseISO(isoString) : isoString;
    return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '—';
  } catch {
    return '—';
  }
}

/**
 * Format a number as compact: 1000 → "1K", 1500000 → "1.5M"
 */
export function formatCompact(n) {
  if (n === null || n === undefined) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Format a rank number with suffix: 1 → "1st", 2 → "2nd", 3 → "3rd"
 */
export function formatRank(n) {
  if (!n) return '—';
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert day name to short form: "monday" → "Mon"
 */
export function shortDay(day) {
  const map = {
    sunday: 'Sun', monday: 'Mon', tuesday: 'Tue',
    wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat',
  };
  return map[day?.toLowerCase()] || day;
}

/**
 * Format time string "18:30" → "6:30 PM"
 */
export function formatTime(timeStr) {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Medal emoji for top 3 ranks.
 */
export function getMedal(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
}

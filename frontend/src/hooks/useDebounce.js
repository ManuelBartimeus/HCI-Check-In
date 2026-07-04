import { useCallback, useRef } from 'react';

/**
 * Debounce a callback function.
 * @param {Function} fn - the callback
 * @param {number} delay - ms delay
 */
export function useDebounce(fn, delay = 300) {
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

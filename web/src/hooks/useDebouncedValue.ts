import { useEffect, useState } from "react";

/**
 * Returns `value` once it has stopped changing for `delayMs`.
 * Empty strings pass through immediately so clearing a search resets at once.
 * Used to keep search inputs from firing a request on every keystroke.
 */
export function useDebouncedValue(value: string, delayMs = 300): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return value === "" ? "" : debounced;
}

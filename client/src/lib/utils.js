/**
 * Utility class combiner for Magic UI and application components.
 * Zero-dependency to prevent Vite import resolution errors if node_modules are not yet re-installed.
 */
export function cn(...inputs) {
  return inputs
    .flat(Infinity)
    .filter(Boolean)
    .map((item) => String(item).trim())
    .filter(Boolean)
    .join(' ');
}

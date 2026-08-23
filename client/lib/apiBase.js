/**
 * API base URL resolver — works correctly on all platforms and deployments:
 * - Browser (all devices): uses same-origin so the request goes to whatever host the page is on.
 *   This works on localhost, Vercel, custom domains, iPhone, Android, Mac, Windows.
 * - Server-side (SSR/RSC): uses NEXT_PUBLIC_API_URL env or falls back to localhost:5000.
 *
 * CRITICAL: Do NOT hardcode localhost:3000 here — it breaks all production API calls
 * for every device that isn't the developer's machine.
 */
export function getApiBase() {
  // In the browser, always use same-origin (works on Vercel, custom domains, any device)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Server-side rendering: use explicit env var or fall back to local dev server
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  return 'http://localhost:5000';
}

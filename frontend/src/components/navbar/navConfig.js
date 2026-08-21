/**
 * navConfig.js
 * ─────────────────────────────────────────────────────────
 * Single source of truth for all navigation items.
 *
 * To add a new page (e.g. Blog, Docs, Careers), simply add
 * an entry here — no changes to Navbar.jsx needed.
 *
 * Fields:
 *   title   – Label rendered in the navbar
 *   href    – Route path
 *   order   – Sort order (ascending)
 *   visible – Toggle visibility without removing the item
 *   badge   – Optional pill badge (e.g. "New", "Soon")
 * ─────────────────────────────────────────────────────────
 */

export const NAV_ITEMS = [
  {
    id: 'home',
    title: 'Home',
    href: '/',
    icon: 'home',
    order: 1,
    visible: true,
  },
  {
    id: 'plus',
    title: 'AskUrSenior Plus',
    href: '/plus',
    icon: 'plus',
    order: 2,
    visible: true,
  },
  {
    id: 'pricing',
    title: 'Pricing',
    href: '/pricing',
    icon: 'pricing',
    order: 3,
    visible: true,
  },
  // ─── Future items – flip visible: true when ready ────────
  // { id: 'blog',    title: 'Blog',    href: '/blog',    order: 4, visible: false },
  // { id: 'docs',    title: 'Docs',    href: '/docs',    order: 5, visible: false },
  // { id: 'careers', title: 'Careers', href: '/careers', order: 6, visible: false },
];

/**
 * Fetches nav items from backend (mirrors the shape above).
 * Falls back to the static NAV_ITEMS if the request fails,
 * so the navbar always renders even without a network call.
 *
 * Usage (optional – only if you want server-driven nav):
 *   const items = await fetchNavItems();
 */
export async function fetchNavItems(apiUrl) {
  if (!apiUrl) return NAV_ITEMS;
  try {
    const res = await fetch(apiUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error('non-2xx');
    const data = await res.json();
    return Array.isArray(data) ? data : NAV_ITEMS;
  } catch {
    return NAV_ITEMS;
  }
}

/**
 * navbar/index.js
 * ─────────────────────────────────────────────────────────
 * Barrel export — import from 'components/navbar' directly.
 *
 * Usage:
 *   import Navbar from '../components/navbar';
 *   import { NAV_ITEMS } from '../components/navbar';
 * ─────────────────────────────────────────────────────────
 */

export { default } from './Navbar';
export { default as NavLogo } from './NavLogo';
export { default as NavigationItems } from './NavigationItems';
export { default as ThemeToggle } from './ThemeToggle';
export { default as AuthSection } from './AuthSection';
export { default as ProfileDropdown } from './ProfileDropdown';
export { default as MobileMenu } from './MobileMenu';
export { NAV_ITEMS, fetchNavItems } from './navConfig';

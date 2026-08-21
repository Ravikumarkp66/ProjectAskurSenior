/* ═══════════════════════════════════════════════════════════════════
   MARKETPLACE CONSTANTS
   AskUrSenior Design Tokens & Constants
═══════════════════════════════════════════════════════════════════ */

export const CATEGORIES = [
    { id: 'all', label: 'All Items', icon: 'ShoppingBag' },
    { id: 'BOOKS', label: 'Books', icon: 'BookOpen' },
    { id: 'ELECTRONICS', label: 'Electronics', icon: 'Laptop' },
    { id: 'CALCULATORS', label: 'Calculators', icon: 'Calculator' },
    { id: 'BAGS', label: 'Bags & Packs', icon: 'ShoppingBag' },
    { id: 'ACCESSORIES', label: 'Accessories', icon: 'Watch' },
    { id: 'FURNITURE', label: 'Furniture', icon: 'Armchair' },
    { id: 'STATIONERY', label: 'Stationery', icon: 'PenTool' },
    { id: 'CLOTHING', label: 'Clothing', icon: 'Shirt' },
    { id: 'LAB_EQUIPMENT', label: 'Lab Equipment', icon: 'FlaskConical' },
    { id: 'OTHER', label: 'Other', icon: 'Package' },
];

export const CONDITIONS = [
    { id: 'NEW', label: 'New', badgeBg: 'bg-emerald-500/10', badgeText: 'text-emerald-400', badgeBorder: 'border-emerald-500/25' },
    { id: 'LIKE_NEW', label: 'Like New', badgeBg: 'bg-teal-500/10', badgeText: 'text-teal-400', badgeBorder: 'border-teal-500/25' },
    { id: 'GOOD', label: 'Good', badgeBg: 'bg-blue-500/10', badgeText: 'text-blue-400', badgeBorder: 'border-blue-500/25' },
    { id: 'FAIR', label: 'Fair', badgeBg: 'bg-amber-500/10', badgeText: 'text-amber-400', badgeBorder: 'border-amber-500/25' },
];

export const LISTING_STATUS = {
    ACTIVE: 'ACTIVE',
    SOLD: 'SOLD',
};

export const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
];

export const SAMPLE_MARKETPLACE_IMAGES = {
    BOOKS: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    ELECTRONICS: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
    CALCULATORS: 'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48b?auto=format&fit=crop&w=800&q=80',
    BAGS: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    ACCESSORIES: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    FURNITURE: 'https://images.unsplash.com/photo-1580481072645-022f9a6d8310?auto=format&fit=crop&w=800&q=80',
    STATIONERY: 'https://images.unsplash.com/photo-1585336261026-8f5786372966?auto=format&fit=crop&w=800&q=80',
    CLOTHING: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    LAB_EQUIPMENT: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
    default: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
};

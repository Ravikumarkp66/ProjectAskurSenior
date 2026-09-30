---
trigger: always_on
description: Permanent UI Design System and visual constitution for AskUrSenior
---

# AskUrSenior UI Design System & Visual Constitution

This is the permanent visual design system for AskUrSenior. All frontend UI code must strictly adhere to these specifications. Do NOT introduce new visual styles, components, or color variants feature-by-feature.

## Design Philosophy
- **Academic utility first**: Clean, dense, highly scannable interfaces inspired by CSES-style information architecture combined with modern SaaS-level spacing, typography, and polish.
- **Tone**: Serious, academic, clean, minimal, information-dense, and fast. Not a flashy startup landing page.
- **Strictly Avoid**: Gradients, glassmorphism, oversized floating cards, excessive box shadows, decorative illustrations, animated backgrounds, and huge padding.

## Typography
- **Primary font**: `Inter`, sans-serif.
- **Weights**:
  - `400`: Body text, descriptions, table cells
  - `500`: Labels, secondary emphasis, pill badges
  - `600`: Button text, card titles, section headings
  - `700`: Major page headings
- **Desktop Scale**:
  - Page heading: `28px` / line-height `32px` / font-weight `700`
  - Section heading: `20px` / line-height `28px` / font-weight `600`
  - Card title: `16px` / line-height `24px` / font-weight `600`
  - Body: `14px` / line-height `22px` / font-weight `400`
  - Secondary / subtext: `13px` / line-height `20px` / font-weight `400`
  - Metadata / badges: `12px` / line-height `18px` / font-weight `500`
- **Mobile Scale**:
  - Page heading: `24px`
  - Section heading: `18px`
  - Card title: `15-16px`
  - Body: `14px`

## Color Palette
### Light Mode
- Background: `#FFFFFF`
- Surface: `#FFFFFF`
- Muted Surface: `#F8FAFC`
- Text Primary: `#111827`
- Text Secondary: `#4B5563`
- Text Muted: `#6B7280`
- Border: `#E5E7EB`
- Strong Border: `#D1D5DB`
- Primary: `#2563EB` (hover: `#1D4ED8`, light: `#EFF6FF`)
- Semantic: Success `#16A34A`, Warning `#D97706`, Danger `#DC2626`

### Dark Mode
- Dark Background: `#0F1115`
- Dark Surface: `#15181D`
- Dark Muted Surface: `#1B1F26`
- Dark Border: `#292E37`
- Dark Text Primary: `#F3F4F6`
- Dark Text Secondary: `#A1A1AA`
- Dark Text Muted: `#71717A`
- Dark Primary: `#3B82F6`

Color is used strictly for hierarchy, interaction, and status. Never paint full cards in accent colors.

## Borders & Radius
- **Border Default**: `1px solid #E5E7EB` (Dark: `1px solid #292E37`). Prefer crisp borders over shadows.
- **Card Shadow**: `box-shadow: none` by default.
- **Elevated elements only**: `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06)`.
- **Border Radius**:
  - Buttons: `6px` (`rounded-[6px]`)
  - Inputs & Selects: `6px` (`rounded-[6px]`)
  - Cards: `8px` (`rounded-lg`)
  - Modals: `10px` (`rounded-[10px]`)
  - Panels: `10px - 12px`
  - Badges / Status Pills: `rounded-full` (ONLY for status tags, badges, and filter pills; never for cards or buttons).

## Spacing System (8px Grid)
`4px` / `8px` / `12px` / `16px` / `24px` / `32px` / `40px` / `48px` / `64px`
- Card padding: `16px` (`p-4`)
- Section spacing: `24px` (`gap-6`, `my-6`)
- Major spacing: `32px` (`my-8`)

## Components Standard
- **Buttons**:
  - Primary: `#2563EB` bg, white text, `6px` radius, weight `500`.
  - Secondary: white bg, `#D1D5DB` border, `#374151` text.
  - Ghost: transparent bg, `#4B5563` text.
  - Standard height: `40px` (`h-10`), Small: `32px` (`h-8`), Large: `44px` (`h-11`).
- **Inputs**:
  - Height `40px`, border `#D1D5DB`, radius `6px`, horizontal padding `12px`, font size `14px`.
  - Focus: border `#2563EB`, focus ring `box-shadow: 0 0 0 2px #DBEAFE`.
- **Icons**: Lucide Icons exclusively (`16px`, `18px`, `20px`). No oversized decorative icons.
- **Tables**: Compact rows (`36-44px`), `1px solid var(--border)` dividers, sticky headers when useful, right-aligned numbers with `tabular-nums`.
- **Motion**: `150-200ms` `ease-out`. Only for hover, focus, dropdown, modal transitions.

## Reusability Rule
Before writing new markup or styles, reuse existing components. Do not invent custom styles or one-off themes.

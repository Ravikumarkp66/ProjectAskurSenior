# AskUrSenior UI Design System v1.0
**The Permanent UI Constitution for AskUrSenior**

---

## 1. Design Philosophy

> **Academic utility first.**
> Clean, dense, highly scannable interfaces inspired by CSES-style information architecture, combined with modern SaaS-level spacing, typography, interactions, and responsiveness.
>
> The interface should feel like a serious academic tool, not a flashy startup landing page.

### Core Tenets
1. **Academic Seriousness**: Minimalist, trustworthy, fast, and distraction-free.
2. **High Information Density**: Prioritize scanability and structural hierarchy over excessive whitespace or decorative filler.
3. **Restraint Over Decoration**: Zero unnecessary gradients, glassmorphism, floating decorative cards, neon glows, or bouncy animations.
4. **Predictable Components**: Every card, table, button, input, and modal belongs to the same design family across all features.

---

## 2. Typography

- **Primary Font**: `Inter`, sans-serif
- **Weights**:
  - `400` → Body text, descriptions, table cells
  - `500` → Labels, form field titles, secondary emphasis, badges
  - `600` → Button text, card titles, section headings
  - `700` → Major page headings

### Typography Scale (Desktop)
| Role | Size | Line Height | Weight |
| :--- | :--- | :--- | :--- |
| **Page Heading** | `28px` (`1.75rem`) | `32px` | 700 |
| **Section Heading** | `20px` (`1.25rem`) | `28px` | 600 |
| **Card Title** | `16px` (`1.0rem`) | `24px` | 600 |
| **Body** | `14px` (`0.875rem`) | `22px` | 400 |
| **Secondary / Subtext** | `13px` (`0.8125rem`) | `20px` | 400 |
| **Small Metadata / Badges**| `12px` (`0.75rem`) | `18px` | 500 |

### Typography Scale (Mobile)
- Page Heading: `24px`
- Section Heading: `18px`
- Card Title: `15px` – `16px`
- Body: `14px`

---

## 3. Color System

The UI is predominantly clean neutrals with a single academic blue primary accent.

### Light Mode (Default)
```css
/* Base Neutrals */
--background:        #ffffff;
--surface:           #ffffff;
--surface-muted:     #f8fafc;

/* Borders */
--border:            #e5e7eb;
--border-strong:     #d1d5db;

/* Text */
--text-primary:      #111827;
--text-secondary:    #4b5563;
--text-muted:        #6b7280;

/* Primary Academic Blue */
--primary:           #2563eb;
--primary-hover:     #1d4ed8;
--primary-light:     #eff6ff;

/* Semantic Accents */
--success:           #16a34a;
--success-light:     #f0fdf4;

--warning:           #d97706;
--warning-light:     #fffbeb;

--danger:            #dc2626;
--danger-light:      #fef2f2;
```

### Dark Mode
```css
--background:        #0f1115;
--surface:           #15181d;
--surface-muted:     #1b1f26;

--border:            #292e37;
--border-strong:     #3e4451;

--text-primary:      #f3f4f6;
--text-secondary:    #a1a1aa;
--text-muted:        #71717a;

--primary:           #3b82f6;
--primary-hover:     #2563eb;
--primary-light:     #1e293b;
```

> **Rule on Accent Colors**: Never paint entire cards or large background areas blue just because they are clickable. Color is used strictly for hierarchy, interactive state, and semantic status.

---

## 4. Borders & Elevation

- **Default Border**: `1px solid #e5e7eb` (Dark: `1px solid #292e37`)
- **Philosophy**: Prefer crisp 1px borders over heavy drop shadows. Avoid glassmorphism, heavy blurs, and floating cards.
- **Card Default**:
  - `border: 1px solid var(--border)`
  - `box-shadow: none`
- **Elevated Element (Dropdowns, Popovers, Modals only)**:
  - `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06)`

---

## 5. Border Radius Scale

Restrained and disciplined radius scale:

| Element | Border Radius |
| :--- | :--- |
| **Buttons** | `6px` |
| **Inputs & Selects** | `6px` |
| **Cards & Containers** | `8px` |
| **Modals & Dialogs** | `10px` |
| **Large Panels / Drawers**| `10px` – `12px` |
| **Pills & Status Tags** | `9999px` (`rounded-full`) |

> **Strict Rule**: Do **not** use `rounded-full` or circular pills on cards, buttons, or inputs. `rounded-full` is reserved solely for status badges, tags, and small pill filters.

---

## 6. Spacing Scale

Based on an `8px` geometric progression:
- `4px` (`0.25rem`) — Micro gaps, badge padding
- `8px` (`0.5rem`) — Icon-to-text spacing, compact gaps
- `12px` (`0.75rem`) — Form field inner padding, compact stack spacing
- `16px` (`1.0rem`) — Standard card padding, component gap
- `24px` (`1.5rem`) — Standard section spacing, page horizontal gutters
- `32px` (`2.0rem`) — Major section separation
- `40px` / `48px` / `64px` — Outer layout structure

---

## 7. Component Specifications

### 7.1 Buttons
- **Heights**: Small `32px`, Default `40px`, Large `44px`
- **Border Radius**: `6px`
- **Font Weight**: `500` (Medium)
- **Variants**:
  - **Primary**: Background `#2563eb`, Text `white`, Hover `#1d4ed8`
  - **Secondary**: Background `#ffffff`, Border `1px solid #d1d5db`, Text `#374151`
  - **Ghost**: Background `transparent`, Border `none`, Text `#4b5563`, Hover `#f3f4f6`
  - **Danger**: Background `#dc2626`, Text `white`, Hover `#b91c1c`

### 7.2 Form Inputs
- **Height**: `40px`
- **Border**: `1px solid #d1d5db` (Dark: `#292e37`)
- **Border Radius**: `6px`
- **Padding**: `0 12px`
- **Font Size**: `14px`
- **Focus State**: `border-color: #2563eb; outline: none; box-shadow: 0 0 0 2px #dbeafe;`

### 7.3 Cards
Structured for rapid scanning and dense information:
- Background: `var(--surface)`
- Border: `1px solid var(--border)`
- Radius: `8px`
- Padding: `16px`
- Shadow: `none`

```text
┌──────────────────────────────────────┐
│ Category/Dept                   Tag  │
│                                      │
│ Main Title (16px / 600)              │
│ Subtitle / Designation (13px / 400)  │
│                                      │
│ Primary Attribute / Code             │
│ Secondary Attribute                  │
│                                      │
│ Metric 1          Metric 2           │
│ 4.1 / 5           4.3 / 5            │
│                                      │
│ Metadata: 86 responses               │
│                                      │
│ Action Link / Button              →  │
└──────────────────────────────────────┘
```

### 7.4 Tables
Academic data must be easy to read and scan:
- Compact row height (`36px` - `44px`)
- Subtle horizontal row borders (`1px solid var(--border)`)
- Clear, muted column headers (`12px` or `13px`, weight `500`, uppercase/tracked)
- Sticky headers for long scrolling tables
- Right-aligned numerical and score values
- Tabular figures (`font-variant-numeric: tabular-nums`)

### 7.5 Icons
- **Icon Set**: **Lucide Icons** exclusively. Do not mix with FontAwesome, Material Icons, or ad-hoc SVGs.
- **Sizes**: `16px`, `18px`, `20px` (Avoid oversized decorative icons).

---

## 8. Motion & Animations

Subtle, utilitarian, and fast:
- **Duration**: `150ms` – `200ms`
- **Easing**: `ease-out`
- **Allowed**: Button hover, card hover, modal open/close, dropdown reveal, tab transition, skeleton loading.
- **Forbidden**: Page bounce, parallax, spinning decorative elements, continuous gradient shifting.

---

## 9. Responsive Layout Rules

1. Desktop layouts are **intentionally redesigned** for mobile, not simply scaled down.
2. Reduce outer padding (`16px` or `12px` on mobile vs `24px` on desktop).
3. Collapse sidebars into standard off-canvas sheets or bottom bars.
4. Stack grid columns (`grid-cols-1`).
5. Transform wide tables into compact cards or scroll containers with frozen headers.
6. Keep primary actions within thumb reach.

---

## 10. Golden Rule for AI & Engineers

> **Every new feature must visually belong to the existing application.**
> 
> Before creating a new component, check whether an existing component can be reused. Never invent a new button style, card style, input style, typography style, color palette, or border radius unless there is a genuine, verified UX requirement.

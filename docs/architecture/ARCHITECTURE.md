# Master 9.8/10 Frozen Production Architecture Blueprint

## Executive Architecture Summary
This document establishes the official **Frozen Production Architecture** for **AskUrSenior**. The architecture is frozen so engineering focus shifts entirely to building exceptional product features.

---

## 🏛️ Final Frozen Directory Hierarchy (`src/`)

```
src/
├── core/                      # Application Infrastructure Foundation (NO business logic)
│   ├── context/               # AuthContext.jsx, ThemeContext.jsx
│   ├── hooks/                 # useAuth.js, useTheme.js, useDebounce.js
│   ├── services/              # apiClient.js, socket.js
│   ├── config/                # Global infrastructure configuration
│   └── constants/             # Single Source of Truth for Global Constants
│
├── features/                  # Domain-Specific Product Modules
│   ├── home/                  # Student Free Dashboard Experience (/home)
│   │   ├── README.md
│   │   ├── index.js           # Barrel export (import { HomePage } from '@/features/home')
│   │   ├── pages/ (HomePage.jsx)
│   │   ├── sections/ (AcademicsSection, CampusSection, ToolsSection, CommunitySection)
│   │   ├── config/ (homeSections.js, homeCards.js)
│   │   ├── schemas/ (home.schema.js)
│   │   └── services/
│   │
│   ├── plus/                  # Premium Student Experience (/plus)
│   │   ├── README.md
│   │   ├── index.js           # Barrel export (import { PlusPage } from '@/features/plus')
│   │   ├── pages/ (PlusPage.jsx)
│   │   ├── sections/ (AcademicsSection, SemesterSection, CareerSection, CommunitySection)
│   │   ├── config/ (plusSections.js, plusCards.js)
│   │   ├── schemas/ (plus.schema.js)
│   │   └── services/
│   │
│   ├── auth/                  # Authentication & Onboarding
│   ├── profile/               # Profile & Settings
│   ├── materials/             # Ask+ Material Finder & Content
│   ├── interviews/            # Placement & Career Experiences
│   ├── campus/                # Campus Hub & Explorer
│   └── admin/                 # Management & Control Panel
│
├── layouts/                   # Application Framework Shells
│   ├── DashboardLayout.jsx    # Master Shell Wrapper
│   ├── Sidebar.jsx            # Left Navigation Sidebar
│   ├── TopBar.jsx             # Top Header Bar
│   └── RightSidebar.jsx       # Right Widget Panel Container
│
├── widgets/                   # Dashboard Framework Widgets
│   ├── StudentCard.jsx        # Profile summary widget
│   ├── MaterialOverviewCard.jsx # Quick material access widget
│   ├── AcademicStreakCard.jsx # Daily study streak widget
│   └── DailyPlannerCard.jsx   # Today's timetable & tasks widget
│
├── components/                # Pure Presentation UI Tree (STRICTLY TWO SUBFOLDERS ONLY)
│   ├── ui/                    # Base UI Primitives (Button, Card, Badge, Avatar, Skeleton)
│   └── common/                # Generic Cross-Feature UI (FeatureCard, SectionHeader, StatChip)
│
├── assets/                    # Media & Brand Assets
├── utils/                     # Pure Functional Helpers (Formatters, CIE Engines)
└── App.jsx                    # Application Entry & Route Definitions
```

---

## 🔒 Layer Dependency Hierarchy

```
       core/                   (Infrastructure - NO Feature Imports)
        │
        ▼
     layouts/                  (Dashboard Shell Framework)
        │
        ▼
     widgets/                  (Dashboard Framework Widgets)
        │
        ▼
   components/                 (ui/ and common/ Presentation Primitives)
        │
        ▼
    features/                  (home, plus, materials, profile, admin, etc.)
```

### 🛑 Strict Feature Boundary Rule
Features CANNOT directly import each other:
`features/home/` ──► ❌ CANNOT IMPORT ──► `features/plus/`

Both features consume shared layers:
- `features/home/` ──► `core/` | `layouts/` | `widgets/` | `components/` | `utils/`
- `features/plus/` ──► `core/` | `layouts/` | `widgets/` | `components/` | `utils/`

---

## 📜 The Golden Engineering Promise
> **The architecture is frozen. Only features evolve.**

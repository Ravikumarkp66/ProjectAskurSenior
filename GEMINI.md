# AskUrSenior Agent Guidelines & UI Constitution

Welcome to the AskUrSenior repository. All agents and subagents working in this workspace must adhere to the project rules and standards.

## 1. UI Design System (Mandatory)
Every frontend task and UI feature must strictly follow the **AskUrSenior UI Design System v1.0**.

- Full specification: [docs/DESIGN_SYSTEM.md](file:///c:/AskUrSenior/docs/DESIGN_SYSTEM.md)
- Rules definition: [.agents/rules/ui-design-system.md](file:///c:/AskUrSenior/.agents/rules/ui-design-system.md)

### Key UI Rules:
- **Design Philosophy**: Academic utility first — clean, dense, highly scannable (CSES-like information density + modern SaaS polish).
- **Typography**: Inter (400 body, 500 labels, 600 headings/card titles, 700 page headings).
- **Colors**:
  - Light: `#FFFFFF` bg, `#F8FAFC` muted, `#111827` primary text, `#4B5563` secondary text, `#E5E7EB` border, `#2563EB` primary academic blue.
  - Dark: `#0F1115` bg, `#15181D` surface, `#1B1F26` muted surface, `#292E37` border, `#F3F4F6` text, `#3B82F6` primary.
- **Borders & Radii**: 1px borders everywhere. Cards have `box-shadow: none` and `8px` radius. Buttons & inputs have `6px` radius. `rounded-full` is restricted to status badges and pills only.
- **Strictly Forbidden**: Neon gradients, glassmorphism, floating glass cards, excessive shadows, oversized typography, bouncy animations.
- **Component Reusability**: Do NOT invent new visual styles, button variations, card variations, or colors for individual features.

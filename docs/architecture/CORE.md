# Core Application Infrastructure (`core/`)

## Purpose
`core/` provides fundamental application infrastructure and runtime services. It contains **zero feature business logic**.

## Components
- **`core/services/apiClient.js`**: Unified Axios HTTP gateway with Bearer token injection and 401 refresh handling.
- **`core/services/socket.js`**: Real-time WebSocket singleton connection manager.
- **`core/context/AuthContext.jsx`**: User authentication session and token state source of truth.
- **`core/context/ThemeContext.jsx`**: Dark/Light mode DOM root attribute driver and storage synchronizer.
- **`core/hooks/useAuth.js`**: Safe authentication context accessor hook.
- **`core/hooks/useTheme.js`**: Safe theme context accessor hook.
- **`core/hooks/useDebounce.js`**: Generic value debouncer hook.

## Infrastructure Rules
1. Feature modules MUST NEVER modify `core/` files for feature-specific logic.
2. `core/` contains no domain-specific UI components or markup.

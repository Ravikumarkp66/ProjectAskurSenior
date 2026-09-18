// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import UserMenu from '../UserMenu';

// Mocks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockLogout = vi.fn();
vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { name: 'Test Student', email: 'test@askursenior.edu' },
        logout: mockLogout,
    }),
}));

vi.mock('../../../context/ThemeContext', () => ({
    useTheme: () => ({
        isDark: false,
        themeMode: 'light',
        setThemeMode: vi.fn(),
    }),
}));

const mockOpenBugReport = vi.fn();
vi.mock('../../../context/BugReportModalContext', () => ({
    useBugReportModal: () => ({
        openBugReport: mockOpenBugReport,
    }),
}));

// Mock framer-motion to render synchronously without delays
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
        button: ({ children, ...props }) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('UserMenu Dropdown Component', () => {
    let container = null;
    let root = null;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        mockNavigate.mockClear();
        mockLogout.mockClear();
        mockOpenBugReport.mockClear();
    });

    afterEach(() => {
        act(() => {
            root?.unmount();
        });
        container?.remove();
        container = null;
    });

    it('MENU-001: Renders closed by default with student initials', () => {
        act(() => {
            root.render(
                <MemoryRouter initialEntries={['/home']}>
                    <UserMenu direction="up" align="left" />
                </MemoryRouter>
            );
        });

        const trigger = container.querySelector('button[title="Account menu"]');
        expect(trigger).not.toBeNull();
        expect(trigger.textContent).toContain('TS');

        // Dropdown popover should not be in the DOM
        expect(container.textContent).not.toContain('My Profile');
        expect(container.textContent).not.toContain('Account');
    });

    it('MENU-002: Opens on trigger click and displays menu options', () => {
        act(() => {
            root.render(
                <MemoryRouter initialEntries={['/home']}>
                    <UserMenu direction="up" align="left" />
                </MemoryRouter>
            );
        });

        const trigger = container.querySelector('button[title="Account menu"]');
        act(() => {
            trigger.click();
        });

        expect(container.textContent).toContain('Test Student');
        expect(container.textContent).toContain('My Profile');
        expect(container.textContent).toContain('Account');
        expect(container.textContent).toContain('Bug Report');
        expect(container.textContent).toContain('Help & Support');
        expect(container.textContent).toContain('Logout');
    });

    it('MENU-003: Clicking Account immediately unmounts popover and navigates to /account', () => {
        act(() => {
            root.render(
                <MemoryRouter initialEntries={['/home']}>
                    <UserMenu direction="up" align="left" />
                </MemoryRouter>
            );
        });

        // Open menu
        const trigger = container.querySelector('button[title="Account menu"]');
        act(() => {
            trigger.click();
        });

        // Find Account button
        const buttons = Array.from(container.querySelectorAll('button'));
        const accountBtn = buttons.find(b => b.textContent.includes('Account') && !b.getAttribute('title'));
        expect(accountBtn).toBeDefined();

        // Click Account
        act(() => {
            accountBtn.click();
        });

        expect(mockNavigate).toHaveBeenCalledWith('/account');
        // Popover must be immediately removed from DOM (no ghost node)
        expect(container.textContent).not.toContain('My Profile');
        expect(container.textContent).not.toContain('test@askursenior.edu');
    });

    it('MENU-004: Clicking outside unmounts the popover immediately', () => {
        act(() => {
            root.render(
                <MemoryRouter initialEntries={['/home']}>
                    <UserMenu direction="up" align="left" />
                </MemoryRouter>
            );
        });

        // Open menu
        const trigger = container.querySelector('button[title="Account menu"]');
        act(() => {
            trigger.click();
        });
        expect(container.textContent).toContain('My Profile');

        // Click outside on document.body
        act(() => {
            const mouseEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
            document.body.dispatchEvent(mouseEvent);
        });

        expect(container.textContent).not.toContain('My Profile');
    });

    it('MENU-005: Pressing Escape closes the menu immediately', () => {
        act(() => {
            root.render(
                <MemoryRouter initialEntries={['/home']}>
                    <UserMenu direction="up" align="left" />
                </MemoryRouter>
            );
        });

        // Open menu
        const trigger = container.querySelector('button[title="Account menu"]');
        act(() => {
            trigger.click();
        });
        expect(container.textContent).toContain('My Profile');

        // Press Escape
        act(() => {
            const keyEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(keyEvent);
        });

        expect(container.textContent).not.toContain('My Profile');
    });

    it('MENU-006: Theme toggle renders only Light and Dark options and does NOT contain Auto', () => {
        act(() => {
            root.render(
                <MemoryRouter initialEntries={['/home']}>
                    <UserMenu direction="up" align="left" />
                </MemoryRouter>
            );
        });

        const trigger = container.querySelector('button[title="Account menu"]');
        act(() => {
            trigger.click();
        });

        expect(container.textContent).toContain('Light');
        expect(container.textContent).toContain('Dark');
        expect(container.textContent).not.toContain('Auto');
    });
});

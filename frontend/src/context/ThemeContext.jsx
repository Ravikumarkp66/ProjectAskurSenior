import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Mode can be: 'light' | 'dark' | 'system'
    const [themeMode, setThemeModeState] = useState(() => {
        const savedMode = localStorage.getItem('aus-theme-mode');
        if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
            return savedMode;
        }
        const v1 = localStorage.getItem('aus-theme');
        const v2 = localStorage.getItem('uiTheme');
        if (v1 === 'light' || v2 === 'light') return 'light';
        if (v1 === 'dark' || v2 === 'dark') return 'dark';
        return 'dark'; // default dark
    });

    const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return true;
    });

    // Listen for OS system preference changes
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            setSystemPrefersDark(e.matches);
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Derived boolean isDark
    const isDark = themeMode === 'system' ? systemPrefersDark : themeMode === 'dark';

    // Apply theme to <html> — drives both Tailwind dark: classes AND CSS variables
    useEffect(() => {
        const root = document.documentElement;

        if (isDark) {
            root.classList.add('dark');
            root.setAttribute('data-theme', 'dark');
        } else {
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
        }

        const effectiveVal = isDark ? 'dark' : 'light';
        localStorage.setItem('aus-theme', effectiveVal);
        localStorage.setItem('uiTheme', effectiveVal);
        localStorage.setItem('aus-theme-mode', themeMode);
        window.dispatchEvent(new CustomEvent('uiThemeChange', { detail: effectiveVal }));
    }, [isDark, themeMode]);

    // Cross-tab sync
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === 'aus-theme-mode') {
                if (['light', 'dark', 'system'].includes(e.newValue)) {
                    setThemeModeState(e.newValue);
                }
            } else if (e.key === 'uiTheme' || e.key === 'aus-theme') {
                if (themeMode !== 'system') {
                    setThemeModeState(e.newValue === 'light' ? 'light' : 'dark');
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [themeMode]);

    const setThemeMode = useCallback((mode) => {
        if (['light', 'dark', 'system'].includes(mode)) {
            setThemeModeState(mode);
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeModeState(prev => {
            if (prev === 'system') {
                return systemPrefersDark ? 'light' : 'dark';
            }
            return prev === 'dark' ? 'light' : 'dark';
        });
    }, [systemPrefersDark]);

    return (
        <ThemeContext.Provider value={{ isDark, themeMode, setThemeMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        return { isDark: true, themeMode: 'dark', setThemeMode: () => {}, toggleTheme: () => {} };
    }
    return ctx;
};

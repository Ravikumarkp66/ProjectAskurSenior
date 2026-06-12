import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Read from localStorage — support both old ('uiTheme') and new ('aus-theme') keys
    const [isDark, setIsDark] = useState(() => {
        const v1 = localStorage.getItem('aus-theme');
        const v2 = localStorage.getItem('uiTheme');
        if (v1 !== null) return v1 === 'dark';
        if (v2 !== null) return v2 === 'dark';
        return true; // default: dark
    });

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

        // Keep both storage keys in sync so DashboardLayout + old code still works
        const val = isDark ? 'dark' : 'light';
        localStorage.setItem('aus-theme', val);
        localStorage.setItem('uiTheme', val);
    }, [isDark]);

    const toggleTheme = useCallback(() => setIsDark(prev => !prev), []);

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
};

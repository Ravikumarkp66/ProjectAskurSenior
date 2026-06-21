import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useTheme } from '../context/ThemeContext';

const SIDEBAR_OPEN   = 280;
const SIDEBAR_CLOSED =  72;

const DashboardLayout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const { isDark } = useTheme();
    const theme      = isDark ? 'dark' : 'light';
    const isLightMode = !isDark;

    const [dashboardState, setDashboardState] = useState({
        progress: 0,
        currentBranch: 'CS',
        cycle: 'P',
        searchQuery: ''
    });

    const sidebarWidth = sidebarCollapsed ? SIDEBAR_CLOSED : SIDEBAR_OPEN;

    return (
        <div className={`flex min-h-screen transition-colors duration-300 ${isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0a0b] text-slate-100'}`}>
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onCollapsedChange={setSidebarCollapsed}
                currentBranch={dashboardState.currentBranch}
                cycle={dashboardState.cycle}
                subjectSearch={dashboardState.searchQuery}
            />

            {/* Main content — shifts smoothly with the sidebar */}
            <div
                className="flex-1 transition-all duration-300"
                style={{ marginLeft: sidebarWidth }}
            >
                <TopBar
                    sidebarCollapsed={sidebarCollapsed}
                    theme={theme}
                    progress={dashboardState.progress}
                    branch={dashboardState.currentBranch}
                />

                <main className="mt-24 p-4 sm:p-6 lg:p-10">
                    <Outlet context={{ setDashboardState, dashboardState, theme, isLightMode, sidebarCollapsed }} />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;

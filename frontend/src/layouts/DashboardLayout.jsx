import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

const DashboardLayout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [theme] = useState(() => localStorage.getItem('uiTheme') || 'dark');
    
    // Shared academic state that was previously in DashboardPage
    // In a production app, these would come from a Context provider
    const [dashboardState, setDashboardState] = useState({
        progress: 0,
        currentBranch: 'CS',
        cycle: 'P',
        searchQuery: ''
    });

    const isLightMode = theme === 'light';

    return (
        <div className={`flex min-h-screen ${isLightMode ? 'bg-white text-slate-900' : 'bg-[#0a0a0b] text-secondary-100'}`}>
            <Sidebar 
                isCollapsed={sidebarCollapsed} 
                onCollapsedChange={setSidebarCollapsed}
                currentBranch={dashboardState.currentBranch}
                cycle={dashboardState.cycle}
                subjectSearch={dashboardState.searchQuery}
            />
            
            <div className={`transition-all duration-300 w-full ${sidebarCollapsed ? 'sm:ml-20' : 'sm:ml-64'}`}>
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

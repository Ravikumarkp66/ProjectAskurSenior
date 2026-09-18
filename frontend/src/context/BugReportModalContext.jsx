import React, { createContext, useContext, useState, useCallback } from 'react';
import BugReportModal from '../components/common/BugReportModal';

const BugReportModalContext = createContext();

export const BugReportModalProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [initialType, setInitialType] = useState('Other');

    const openBugReport = useCallback((type = 'Other') => {
        setInitialType(type);
        setIsOpen(true);
    }, []);

    const closeBugReport = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <BugReportModalContext.Provider value={{ isOpen, openBugReport, closeBugReport }}>
            {children}
            <BugReportModal
                isOpen={isOpen}
                onClose={closeBugReport}
                initialProblemType={initialType}
            />
        </BugReportModalContext.Provider>
    );
};

export const useBugReportModal = () => {
    const context = useContext(BugReportModalContext);
    if (!context) {
        return {
            isOpen: false,
            openBugReport: () => {},
            closeBugReport: () => {}
        };
    }
    return context;
};

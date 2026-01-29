import React, { createContext, useState, useCallback } from 'react';

export const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
    const [subjects, setSubjects] = useState([]);
    const [progress, setProgress] = useState(0);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [expandedSubject, setExpandedSubject] = useState(null);
    const [loading, setLoading] = useState(false);

    const updateProgress = useCallback((newProgress) => {
        setProgress(newProgress);
    }, []);

    const updateSubjects = useCallback((newSubjects) => {
        setSubjects(newSubjects);
    }, []);

    const toggleSubjectExpanded = useCallback((subjectId) => {
        setExpandedSubject(expandedSubject === subjectId ? null : subjectId);
    }, [expandedSubject]);

    const value = {
        subjects,
        progress,
        selectedSubject,
        expandedSubject,
        loading,
        updateProgress,
        updateSubjects,
        toggleSubjectExpanded,
        setSelectedSubject,
        setLoading
    };

    return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};

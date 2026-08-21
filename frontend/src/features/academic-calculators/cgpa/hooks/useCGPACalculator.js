/* ═══════════════════════════════════════════════════════════════════
   useCGPACalculator Hook
   Encapsulates state and calculation handlers for CGPA
   ═══════════════════════════════════════════════════════════════════ */

import { useState, useCallback } from 'react';
import { calculateCGPA } from '../utils/calculateCGPA';

const DEFAULT_SEMESTERS = [
    { id: 1, name: 'Semester 1', sgpa: '8.20', credits: 24 },
    { id: 2, name: 'Semester 2', sgpa: '8.60', credits: 22 },
    { id: 3, name: 'Semester 3', sgpa: '8.40', credits: 23 },
];

export const useCGPACalculator = () => {
    const [semesters, setSemesters] = useState(DEFAULT_SEMESTERS);
    const [result, setResult] = useState(null);
    const [validationError, setValidationError] = useState('');
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const addSemester = useCallback(() => {
        setResult(null);
        setValidationError('');
        setSemesters(prev => [
            ...prev,
            {
                id: Date.now(),
                name: `Semester ${prev.length + 1}`,
                sgpa: '',
                credits: 20
            }
        ]);
    }, []);

    const removeSemester = useCallback((id) => {
        setResult(null);
        setValidationError('');
        setSemesters(prev => prev.filter(sem => sem.id !== id));
    }, []);

    const updateSemester = useCallback((id, field, value) => {
        setResult(null);
        setValidationError('');
        setSemesters(prev => prev.map(sem => {
            if (sem.id === id) {
                return { ...sem, [field]: value };
            }
            return sem;
        }));
    }, []);

    const handleCalculate = useCallback(() => {
        setValidationError('');

        if (semesters.length === 0) {
            setValidationError('Please add at least one semester to calculate CGPA.');
            setResult(null);
            return;
        }

        const calcRes = calculateCGPA(semesters);
        if (calcRes.error) {
            setValidationError(calcRes.error);
            setResult(null);
        } else {
            setResult(calcRes);
        }
    }, [semesters]);

    const requestReset = useCallback(() => {
        if (semesters.length > 0) {
            setShowResetConfirm(true);
        } else {
            confirmReset();
        }
    }, [semesters]);

    const confirmReset = useCallback(() => {
        setSemesters(DEFAULT_SEMESTERS);
        setResult(null);
        setValidationError('');
        setShowResetConfirm(false);
    }, []);

    const cancelReset = useCallback(() => {
        setShowResetConfirm(false);
    }, []);

    return {
        semesters,
        result,
        validationError,
        showResetConfirm,
        addSemester,
        removeSemester,
        updateSemester,
        handleCalculate,
        requestReset,
        confirmReset,
        cancelReset
    };
};

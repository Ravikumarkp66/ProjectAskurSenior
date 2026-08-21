/* ═══════════════════════════════════════════════════════════════════
   useSGPACalculator Hook
   Encapsulates state, prefilled curriculum, and handlers for SGPA
   ═══════════════════════════════════════════════════════════════════ */

import { useState, useCallback } from 'react';
import { calculateSGPA } from '../utils/calculateSGPA';

const PREFILLED_SUBJECTS = {
    'CSE-3': [
        { id: 1, name: 'Statistics and Probability', code: '3SMA4TC', credits: 4, grade: 'O' },
        { id: 2, name: 'Operating Systems', code: '3SCS01', credits: 3, grade: 'A+' },
        { id: 3, name: 'Digital Circuits & Computer Org', code: '3SCS02', credits: 3, grade: 'A' },
        { id: 4, name: 'Data Structures and Applications', code: '3SCS03', credits: 3, grade: 'A+' },
        { id: 5, name: 'Data Structures Laboratory', code: '3SCSL01', credits: 1, grade: 'O' },
        { id: 6, name: 'Engineering Science Course', code: '3ESC01', credits: 3, grade: 'B+' },
        { id: 7, name: 'Social Connect & Responsibility', code: '3UHV01', credits: 1, grade: 'O' },
        { id: 8, name: 'Ability Enhancement Course III', code: 'AEC03', credits: 1, grade: 'A' }
    ],
    'CSE-4': [
        { id: 1, name: 'Design and Analysis of Algorithms', code: '4SCS01', credits: 3, grade: 'O' },
        { id: 2, name: 'Microcontroller & Embedded Systems', code: '4SCS02', credits: 3, grade: 'A+' },
        { id: 3, name: 'Theory of Computation', code: '4SCS03', credits: 3, grade: 'A' },
        { id: 4, name: 'Algorithms Laboratory', code: '4SCSL01', credits: 1, grade: 'O' },
        { id: 5, name: 'Engineering Science Course', code: '4ESC01', credits: 3, grade: 'B+' },
        { id: 6, name: 'Biology for Engineers', code: '4BSC01', credits: 3, grade: 'A' },
        { id: 7, name: 'Universal Human Values', code: '4UHV01', credits: 1, grade: 'O' }
    ],
    'ISE-3': [
        { id: 1, name: 'Statistics and Probability', code: 'S3MAT1', credits: 3, grade: 'O' },
        { id: 2, name: 'Digital Circuits & Computer Org', code: 'S3ISI01', credits: 4, grade: 'A+' },
        { id: 3, name: 'Advanced Web Technology', code: 'S3ISI02', credits: 4, grade: 'A' },
        { id: 4, name: 'Data Structures', code: 'S3IS01', credits: 3, grade: 'A+' },
        { id: 5, name: 'Data Structures Laboratory', code: 'S3ISL01', credits: 1, grade: 'O' },
        { id: 6, name: 'Object Oriented Programming with Java', code: 'S3ISES03', credits: 3, grade: 'A' }
    ]
};

const DEFAULT_SUBJECTS = [
    { id: 1, name: 'Mathematics', code: 'MAT101', credits: 4, grade: 'O' },
    { id: 2, name: 'Physics / Chemistry', code: 'PHY101', credits: 4, grade: 'A+' },
    { id: 3, name: 'Programming Fundamentals', code: 'CS101', credits: 3, grade: 'A' },
    { id: 4, name: 'Basic Electrical Engineering', code: 'EE101', credits: 3, grade: 'B+' },
    { id: 5, name: 'Engineering Physics Lab', code: 'PHYL101', credits: 1, grade: 'O' }
];

export const useSGPACalculator = () => {
    const [branch, setBranch] = useState('');
    const [semester, setSemester] = useState('1');
    const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
    const [result, setResult] = useState(null);
    const [validationError, setValidationError] = useState('');
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Prefill subjects when branch & semester change
    const handlePrefillCurriculum = useCallback((selectedBranch, selectedSem) => {
        setBranch(selectedBranch);
        setSemester(selectedSem);
        setResult(null);
        setValidationError('');

        const key = `${selectedBranch}-${selectedSem}`;
        if (PREFILLED_SUBJECTS[key]) {
            setSubjects(PREFILLED_SUBJECTS[key]);
        }
    }, []);

    // Subject editing handlers
    const addSubject = useCallback(() => {
        setResult(null);
        setValidationError('');
        setSubjects(prev => [
            ...prev,
            {
                id: Date.now(),
                name: `Subject ${prev.length + 1}`,
                code: '',
                credits: 3,
                grade: 'A'
            }
        ]);
    }, []);

    const removeSubject = useCallback((id) => {
        setResult(null);
        setValidationError('');
        setSubjects(prev => prev.filter(sub => sub.id !== id));
    }, []);

    const updateSubject = useCallback((id, field, value) => {
        setResult(null);
        setValidationError('');
        setSubjects(prev => prev.map(sub => {
            if (sub.id === id) {
                return { ...sub, [field]: value };
            }
            return sub;
        }));
    }, []);

    // Calculation trigger
    const handleCalculate = useCallback(() => {
        setValidationError('');

        if (subjects.length === 0) {
            setValidationError('Please add at least one subject to calculate SGPA.');
            setResult(null);
            return;
        }

        // Validate that credits are valid numbers
        for (const sub of subjects) {
            const cr = parseFloat(sub.credits);
            if (isNaN(cr) || cr <= 0) {
                setValidationError(`Invalid credits for "${sub.name || 'Subject'}". Credits must be greater than 0.`);
                setResult(null);
                return;
            }
        }

        const calcRes = calculateSGPA(subjects);
        if (calcRes.error) {
            setValidationError(calcRes.error);
            setResult(null);
        } else {
            setResult(calcRes);
        }
    }, [subjects]);

    // Reset handler
    const requestReset = useCallback(() => {
        if (subjects.length > 0) {
            setShowResetConfirm(true);
        } else {
            confirmReset();
        }
    }, [subjects]);

    const confirmReset = useCallback(() => {
        setSubjects(DEFAULT_SUBJECTS);
        setBranch('');
        setSemester('1');
        setResult(null);
        setValidationError('');
        setShowResetConfirm(false);
    }, []);

    const cancelReset = useCallback(() => {
        setShowResetConfirm(false);
    }, []);

    return {
        branch,
        semester,
        subjects,
        result,
        validationError,
        showResetConfirm,
        handlePrefillCurriculum,
        addSubject,
        removeSubject,
        updateSubject,
        handleCalculate,
        requestReset,
        confirmReset,
        cancelReset,
        setBranch,
        setSemester
    };
};

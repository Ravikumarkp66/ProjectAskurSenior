import React from 'react';
import { StudentAcademicsProvider } from '../../../contexts/StudentAcademicsContext';
import AcademicOverviewSection from '../student-academics/sections/AcademicOverviewSection';

/**
 * F-08: Academic Overview / Academic Summary Page
 * The student's single academic snapshot for the current semester.
 * Read-only aggregator of Attendance (F-02), CIE (F-07), SEE module, SGPA/CGPA, and Subject Evaluations.
 */
const AcademicSummaryPage = () => {
    return (
        <StudentAcademicsProvider>
            <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 md:py-4">
                <AcademicOverviewSection />
            </div>
        </StudentAcademicsProvider>
    );
};

export default AcademicSummaryPage;

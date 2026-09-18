import React from 'react';
import SemesterResultSheet from '../../../components/SemesterResultSheet';

/**
 * SgpaSettings Page (Mounted at /home/sgpa, /home/sgpa-calculator, /home/cgpa-calculator)
 * Fully upgraded to the authoritative F-10 Student Semester Result Flow.
 * Old manual entry and calculator simulations have been replaced by real-time institutional evaluation.
 */
const SgpaSettings = () => {
    return <SemesterResultSheet initialSemester={1} />;
};

export default SgpaSettings;

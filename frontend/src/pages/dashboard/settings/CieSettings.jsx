import React from 'react';
import SemesterResultSheet from '../../../components/SemesterResultSheet';

/**
 * CieSettings Page (Mounted at /home/cie, /plus/cie, /plus/cie-analyzer)
 * Fully aligned with the authoritative F-03 / F-10 Institutional CIE Result Sheet.
 */
const CieSettings = () => {
    return <SemesterResultSheet initialTab="cie" />;
};

export default CieSettings;

import React from 'react';
import { motion } from 'framer-motion';

const GraduationCapIcon = ({ className, ...props }) => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className={className}
      {...props}
    >
      <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        {/* Diamond top */}
        <path d="M32 12 L56 24 L32 36 L8 24 Z" fill="currentColor" fillOpacity="0.1" />
        {/* Skullcap / base */}
        <path d="M16 28 V40 C16 48, 24 52, 32 52 C40 52, 48 48, 48 40 V28" />
        {/* Tassel */}
        <path d="M32 24 L48 36 V48" strokeWidth="3" />
        <circle cx="48" cy="50" r="3" fill="currentColor" stroke="none" />
      </g>
    </motion.svg>
  );
};

export default GraduationCapIcon;

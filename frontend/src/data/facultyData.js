export const FACULTY_DEPARTMENTS = [
    { id: 'all', label: 'All Departments' },
    { id: 'ISE', label: 'Information Science (ISE)' },
    { id: 'CSE', label: 'Computer Science (CSE)' },
    { id: 'ECE', label: 'Electronics & Comm (ECE)' },
    { id: 'EEE', label: 'Electrical & Electronics (EEE)' },
    { id: 'MECH', label: 'Mechanical Eng (MECH)' },
    { id: 'CIVIL', label: 'Civil Engineering (CIVIL)' },
    { id: 'BT', label: 'Biotechnology (BT)' },
    { id: 'CH', label: 'Chemical Eng (CH)' },
    { id: 'IM', label: 'Industrial Eng (IM)' },
    { id: 'ETC', label: 'Telecommunication (ETC)' },
    { id: 'EIE', label: 'Instrumentation Eng (EIE)' },
    { id: 'MATH', label: 'Mathematics (MATH)' },
    { id: 'CHEM', label: 'Chemistry (CHEM)' },
    { id: 'PHY', label: 'Physics (PHY)' },
];

export const TOP_FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'most_reviewed', label: 'Most Reviewed' },
    { id: 'highest_rated', label: 'Highest Rated' },
    { id: 'strict', label: 'Strict' },
    { id: 'friendly', label: 'Friendly' },
    { id: 'easy_scoring', label: 'Easy Scoring' },
    { id: 'best_mentor', label: 'Best Mentor' },
    { id: 'lab_faculty', label: 'Lab Faculty' },
];

// No fake data. All 209+ faculty members are loaded dynamically from MongoDB.
export const MOCK_FACULTY_LIST = [];

/**
 * profileDemoData.js — Realistic synthetic demo dataset for Anonymous (State 1) profile preview.
 * 
 * Strict data rule:
 * - Anonymous users NEVER receive another student's real private data.
 * - This file provides the clean, realistic synthetic dataset for preview.
 */

export const DEMO_STUDENT_PROFILE = {
    id: 'demo-student-001',
    name: 'Aditya Rao',
    username: 'aditya_rao',
    usn: '1SI23IS000',
    usnVerified: false,
    college: 'Siddaganga Institute of Technology',
    collegeName: 'Siddaganga Institute of Technology',
    branch: 'ISE',
    academicSection: 'A',
    section: 'A',
    labBatch: '1',
    scheme: '2022',
    semester: 4,
    graduationYear: '2027',
    admissionYear: '2023',
    bio: 'Undergraduate engineering student exploring systems architecture, algorithms, and distributed computing.',
    profilePicture: '',
    socialLinks: {
        github: 'adityarao',
        linkedin: 'aditya-rao',
        x: 'adityarao_dev'
    }
};

export const DEMO_CGPA_SEMESTERS = [
    { semester: 1, sgpa: 8.20, credits: 20 },
    { semester: 2, sgpa: 8.45, credits: 20 },
    { semester: 3, sgpa: 8.60, credits: 22 },
    { semester: 4, sgpa: 8.85, credits: 22 }
];

export const DEMO_CGPA_CHART_DATA = [
    { semester: 'Sem 1', sgpa: 8.20, cgpa: 8.20 },
    { semester: 'Sem 2', sgpa: 8.45, cgpa: 8.33 },
    { semester: 'Sem 3', sgpa: 8.60, cgpa: 8.42 },
    { semester: 'Sem 4', sgpa: 8.85, cgpa: 8.53 }
];

export const DEMO_ATTENDANCE_SUBJECTS = [
    {
        subjectId: 'demo-mat41',
        code: '21MAT41',
        name: 'Mathematics IV (Complex Analysis)',
        attendancePercentage: 88.5,
        analytics: { present: 23, conducted: 26 }
    },
    {
        subjectId: 'demo-cs42',
        code: '21CS42',
        name: 'Design & Analysis of Algorithms',
        attendancePercentage: 84.6,
        analytics: { present: 22, conducted: 26 }
    },
    {
        subjectId: 'demo-cs43',
        code: '21CS43',
        name: 'Operating Systems',
        attendancePercentage: 81.8,
        analytics: { present: 18, conducted: 22 }
    },
    {
        subjectId: 'demo-cs44',
        code: '21CS44',
        name: 'Microcontrollers & Embedded Systems',
        attendancePercentage: 90.0,
        analytics: { present: 18, conducted: 20 }
    }
];

export const DEMO_TODAY_CLASSES = [
    {
        _id: 'demo-slot-1',
        timeSlot: '09:00-10:00',
        startMinute: 540,
        endMinute: 600,
        subjectCode: '21CS43',
        subjectName: 'Operating Systems',
        room: 'LH-201',
        lectureType: 'Theory',
        status: 'Yet To Be Taken'
    },
    {
        _id: 'demo-slot-2',
        timeSlot: '10:00-11:00',
        startMinute: 600,
        endMinute: 660,
        subjectCode: '21CS42',
        subjectName: 'Design & Analysis of Algorithms',
        room: 'LH-201',
        lectureType: 'Theory',
        status: 'Yet To Be Taken'
    },
    {
        _id: 'demo-slot-3',
        timeSlot: '11:00-11:15',
        startMinute: 660,
        endMinute: 675,
        subjectCode: '',
        subjectName: 'Tea Break',
        room: '',
        lectureType: 'Break',
        status: 'Yet To Be Taken'
    },
    {
        _id: 'demo-slot-4',
        timeSlot: '11:15-13:15',
        startMinute: 675,
        endMinute: 795,
        subjectCode: '21CSL46',
        subjectName: 'DAA Laboratory',
        room: 'CC-Lab 2',
        lectureType: 'Lab',
        status: 'Yet To Be Taken'
    },
    {
        _id: 'demo-slot-5',
        timeSlot: '14:00-15:00',
        startMinute: 840,
        endMinute: 900,
        subjectCode: '21MAT41',
        subjectName: 'Complex Analysis',
        room: 'LH-201',
        lectureType: 'Theory',
        status: 'Yet To Be Taken'
    }
];

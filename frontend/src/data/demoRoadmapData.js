/**
 * Static Demo Roadmap Data
 * Used for Non-Logged-In Users and Free Logged-In Users.
 * Provides realistic academic timelines without any database or API requests.
 */

export const DEMO_AVAILABLE_SEMESTERS = [
    { semester: 1, number: 1, label: 'Semester 1', eventCount: 10, eventsCount: 10, academicYear: '2026-27' },
    { semester: 2, number: 2, label: 'Semester 2', eventCount: 11, eventsCount: 11, academicYear: '2026-27' },
    { semester: 3, number: 3, label: 'Semester 3', eventCount: 12, eventsCount: 12, academicYear: '2026-27' },
    { semester: 4, number: 4, label: 'Semester 4', eventCount: 11, eventsCount: 11, academicYear: '2026-27' },
    { semester: 5, number: 5, label: 'Semester 5', eventCount: 12, eventsCount: 12, academicYear: '2026-27' },
    { semester: 6, number: 6, label: 'Semester 6', eventCount: 11, eventsCount: 11, academicYear: '2026-27' },
    { semester: 7, number: 7, label: 'Semester 7', eventCount: 10, eventsCount: 10, academicYear: '2026-27' },
    { semester: 8, number: 8, label: 'Semester 8', eventCount: 8, eventsCount: 8, academicYear: '2026-27' }
];

const SEMESTER_3_EVENTS = [
    {
        id: 'demo-3-1',
        title: 'Commencement of 3rd Semester Classes',
        eventType: 'ACADEMIC',
        startDate: '2026-08-18',
        endDate: '2026-08-18',
        status: 'COMPLETED',
        priority: 'Normal',
        shortDescription: 'Official reopening and commencement of odd semester coursework and laboratory sessions.'
    },
    {
        id: 'demo-3-2',
        title: 'Technical Clubs Orientation & Registrations',
        eventType: 'CAMPUS',
        startDate: '2026-09-05',
        endDate: '2026-09-06',
        status: 'COMPLETED',
        priority: 'Normal',
        shortDescription: 'Recruitment drives and domain workshops for IEEE, ACM, GDG, and technical student societies.'
    },
    {
        id: 'demo-3-3',
        title: 'Varasiddhi Vinayaka Vratha',
        eventType: 'HOLIDAY',
        startDate: '2026-09-14',
        endDate: '2026-09-14',
        status: 'COMPLETED',
        priority: 'Normal',
        shortDescription: 'State public holiday. College campus remains closed.'
    },
    {
        id: 'demo-3-4',
        title: 'Continuous Internal Evaluation 1 (CIE-1)',
        eventType: 'CIE',
        startDate: '2026-09-28',
        endDate: '2026-09-30',
        status: 'COMPLETED',
        priority: 'Important',
        shortDescription: 'First internal assessment covering Modules 1 and 2 across all registered theory courses.'
    },
    {
        id: 'demo-3-5',
        title: 'Mahatma Gandhi Jayanti',
        eventType: 'HOLIDAY',
        startDate: '2026-10-02',
        endDate: '2026-10-02',
        status: 'COMPLETED',
        priority: 'Normal',
        shortDescription: 'National public holiday commemorating the birth of Mahatma Gandhi.'
    },
    {
        id: 'demo-3-6',
        title: 'Mid-Term Attendance & CIE-1 Marks Audit',
        eventType: 'ACADEMIC',
        startDate: '2026-10-15',
        endDate: '2026-10-16',
        status: 'ONGOING',
        priority: 'Important',
        shortDescription: 'Display of official cumulative attendance report and announcement of CIE-1 evaluated scores.'
    },
    {
        id: 'demo-3-7',
        title: 'Continuous Internal Evaluation 2 (CIE-2)',
        eventType: 'CIE',
        startDate: '2026-10-28',
        endDate: '2026-10-30',
        status: 'UPCOMING',
        priority: 'Critical',
        shortDescription: 'Second assessment testing Modules 3 and 4. Crucial gateway for overall internal marks.'
    },
    {
        id: 'demo-3-8',
        title: 'Kannada Rajyotsava',
        eventType: 'HOLIDAY',
        startDate: '2026-11-01',
        endDate: '2026-11-01',
        status: 'UPCOMING',
        priority: 'Normal',
        shortDescription: 'State public holiday celebrating Karnataka state formation.'
    },
    {
        id: 'demo-3-9',
        title: 'Continuous Internal Evaluation 3 (CIE-3)',
        eventType: 'CIE',
        startDate: '2026-11-16',
        endDate: '2026-11-18',
        status: 'UPCOMING',
        priority: 'Important',
        shortDescription: 'Final theory CIE and lab internal exams to finalize the continuous internal evaluation marks.'
    },
    {
        id: 'demo-3-10',
        title: 'VTU Semester Exam Application & Fee Deadline',
        eventType: 'DEADLINE',
        startDate: '2026-11-25',
        endDate: '2026-11-25',
        status: 'UPCOMING',
        priority: 'Critical',
        shortDescription: 'Mandatory submission of university exam applications and examination fee payment.'
    },
    {
        id: 'demo-3-11',
        title: 'Last Working Day & Hall Ticket Release',
        eventType: 'ACADEMIC',
        startDate: '2026-12-05',
        endDate: '2026-12-05',
        status: 'UPCOMING',
        priority: 'Normal',
        shortDescription: 'Final attendance cutoff freeze, eligibility list publication, and distribution of admit cards.'
    },
    {
        id: 'demo-3-12',
        title: 'VTU Semester End Examinations (SEE)',
        eventType: 'EXAM',
        startDate: '2026-12-15',
        endDate: '2027-01-10',
        status: 'UPCOMING',
        priority: 'Critical',
        shortDescription: 'External university examinations conducted at assigned center covering the full syllabus.'
    }
];

const SEMESTER_4_EVENTS = [
    {
        id: 'demo-4-1',
        title: 'Commencement of 4th Semester Classes',
        eventType: 'ACADEMIC',
        startDate: '2027-02-15',
        endDate: '2027-02-15',
        status: 'COMPLETED',
        priority: 'Normal',
        shortDescription: 'Commencement of even semester classes, elective selections, and laboratory sessions.'
    },
    {
        id: 'demo-4-2',
        title: 'Maha Shivaratri',
        eventType: 'HOLIDAY',
        startDate: '2027-03-08',
        endDate: '2027-03-08',
        status: 'COMPLETED',
        priority: 'Normal',
        shortDescription: 'General public holiday. No classes scheduled.'
    },
    {
        id: 'demo-4-3',
        title: 'Continuous Internal Evaluation 1 (CIE-1)',
        eventType: 'CIE',
        startDate: '2027-03-22',
        endDate: '2027-03-24',
        status: 'COMPLETED',
        priority: 'Important',
        shortDescription: 'First internal evaluation for 4th semester theory subjects covering Modules 1 and 2.'
    },
    {
        id: 'demo-4-4',
        title: 'Ugadi Festival',
        eventType: 'HOLIDAY',
        startDate: '2027-04-09',
        endDate: '2027-04-09',
        status: 'COMPLETED',
        priority: 'Normal',
        shortDescription: 'Regional holiday. Campus closed.'
    },
    {
        id: 'demo-4-5',
        title: 'Mid-Semester Attendance & Performance Review',
        eventType: 'ACADEMIC',
        startDate: '2027-04-18',
        endDate: '2027-04-19',
        status: 'ONGOING',
        priority: 'Important',
        shortDescription: 'Mid-term academic audit, display of cumulative attendance, and remediation notices.'
    },
    {
        id: 'demo-4-6',
        title: 'Continuous Internal Evaluation 2 (CIE-2)',
        eventType: 'CIE',
        startDate: '2027-04-28',
        endDate: '2027-04-30',
        status: 'UPCOMING',
        priority: 'Critical',
        shortDescription: 'Second internal assessment covering Modules 3 and 4 across all core subjects.'
    },
    {
        id: 'demo-4-7',
        title: 'May Day',
        eventType: 'HOLIDAY',
        startDate: '2027-05-01',
        endDate: '2027-05-01',
        status: 'UPCOMING',
        priority: 'Normal',
        shortDescription: 'International Workers Day holiday.'
    },
    {
        id: 'demo-4-8',
        title: 'Continuous Internal Evaluation 3 (CIE-3)',
        eventType: 'CIE',
        startDate: '2027-05-18',
        endDate: '2027-05-20',
        status: 'UPCOMING',
        priority: 'Important',
        shortDescription: 'Final internal evaluation and lab test completion.'
    },
    {
        id: 'demo-4-9',
        title: 'VTU Exam Form Submission Deadline',
        eventType: 'DEADLINE',
        startDate: '2027-05-28',
        endDate: '2027-05-28',
        status: 'UPCOMING',
        priority: 'Critical',
        shortDescription: 'Last date for submitting even semester exam registration without late fine.'
    },
    {
        id: 'demo-4-10',
        title: 'Last Working Day & Hall Ticket Release',
        eventType: 'ACADEMIC',
        startDate: '2027-06-08',
        endDate: '2027-06-08',
        status: 'UPCOMING',
        priority: 'Normal',
        shortDescription: 'Finalization of CIE attendance eligibility and release of university admission tickets.'
    },
    {
        id: 'demo-4-11',
        title: 'VTU Semester End Examinations (SEE)',
        eventType: 'EXAM',
        startDate: '2027-06-18',
        endDate: '2027-07-12',
        status: 'UPCOMING',
        priority: 'Critical',
        shortDescription: 'University theory and lab exams for 4th semester courses.'
    }
];

const SEMESTER_1_EVENTS = [
    {
        id: 'demo-1-1',
        title: 'Inauguration & Student Induction Program (SIP)',
        eventType: 'CAMPUS',
        startDate: '2026-09-10',
        endDate: '2026-09-17',
        status: 'COMPLETED',
        priority: 'Normal',
        shortDescription: 'Welcome ceremony, department visits, campus orientation, and mentor allocations.'
    },
    {
        id: 'demo-1-2',
        title: 'Commencement of Regular 1st Year Classes',
        eventType: 'ACADEMIC',
        startDate: '2026-09-18',
        endDate: '2026-09-18',
        status: 'COMPLETED',
        priority: 'Normal',
        shortDescription: 'Start of Physics/Chemistry cycle lectures, labs, and emerging technology tracks.'
    },
    {
        id: 'demo-1-3',
        title: 'Mahatma Gandhi Jayanti',
        eventType: 'HOLIDAY',
        startDate: '2026-10-02',
        endDate: '2026-10-02',
        status: 'COMPLETED',
        priority: 'Normal',
        shortDescription: 'National public holiday.'
    },
    {
        id: 'demo-1-4',
        title: 'Continuous Internal Evaluation 1 (CIE-1)',
        eventType: 'CIE',
        startDate: '2026-10-25',
        endDate: '2026-10-27',
        status: 'ONGOING',
        priority: 'Important',
        shortDescription: 'First internal assessment covering introductory modules for Mathematics, Physics/Chemistry.'
    },
    {
        id: 'demo-1-5',
        title: 'Kannada Rajyotsava',
        eventType: 'HOLIDAY',
        startDate: '2026-11-01',
        endDate: '2026-11-01',
        status: 'UPCOMING',
        priority: 'Normal',
        shortDescription: 'State public holiday celebrating Karnataka state formation.'
    },
    {
        id: 'demo-1-6',
        title: 'Continuous Internal Evaluation 2 (CIE-2)',
        eventType: 'CIE',
        startDate: '2026-11-20',
        endDate: '2026-11-22',
        status: 'UPCOMING',
        priority: 'Critical',
        shortDescription: 'Second assessment testing Modules 3 and 4 across 1st year foundational subjects.'
    },
    {
        id: 'demo-1-7',
        title: 'Continuous Internal Evaluation 3 (CIE-3)',
        eventType: 'CIE',
        startDate: '2026-12-10',
        endDate: '2026-12-12',
        status: 'UPCOMING',
        priority: 'Important',
        shortDescription: 'Final internal evaluation and lab records verification.'
    },
    {
        id: 'demo-1-8',
        title: 'VTU 1st Year Exam Registration Deadline',
        eventType: 'DEADLINE',
        startDate: '2026-12-20',
        endDate: '2026-12-20',
        status: 'UPCOMING',
        priority: 'Critical',
        shortDescription: 'University USN generation and examination registration deadline.'
    },
    {
        id: 'demo-1-9',
        title: 'Last Working Day of 1st Semester',
        eventType: 'ACADEMIC',
        startDate: '2027-01-05',
        endDate: '2027-01-05',
        status: 'UPCOMING',
        priority: 'Normal',
        shortDescription: 'Final attendance cutoff freeze and eligibility announcement.'
    },
    {
        id: 'demo-1-10',
        title: 'VTU 1st Semester End Examinations (SEE)',
        eventType: 'EXAM',
        startDate: '2027-01-15',
        endDate: '2027-02-05',
        status: 'UPCOMING',
        priority: 'Critical',
        shortDescription: 'First university semester end examinations.'
    }
];

export function getDemoRoadmapData(semNumber = 3) {
    const sem = Number(semNumber) || 3;
    let events = SEMESTER_3_EVENTS;
    let startDate = '2026-08-18';
    let endDate = '2026-12-20';
    let progressPercent = 54;
    let upNext = {
        id: 'demo-3-7',
        title: 'Continuous Internal Evaluation 2 (CIE-2)',
        eventType: 'CIE',
        startDate: '2026-10-28',
        endDate: '2026-10-30',
        date: '2026-10-28',
        daysLeft: 14,
        status: 'UPCOMING',
        shortDescription: 'Second assessment testing Modules 3 and 4 across all core theory subjects.'
    };

    if (sem === 4) {
        events = SEMESTER_4_EVENTS;
        startDate = '2027-02-15';
        endDate = '2027-07-12';
        progressPercent = 48;
        upNext = {
            id: 'demo-4-6',
            title: 'Continuous Internal Evaluation 2 (CIE-2)',
            eventType: 'CIE',
            startDate: '2027-04-28',
            endDate: '2027-04-30',
            date: '2027-04-28',
            daysLeft: 10,
            status: 'UPCOMING',
            shortDescription: 'Second internal assessment covering Modules 3 and 4 across all core subjects.'
        };
    } else if (sem === 1) {
        events = SEMESTER_1_EVENTS;
        startDate = '2026-09-10';
        endDate = '2027-02-05';
        progressPercent = 38;
        upNext = {
            id: 'demo-1-6',
            title: 'Continuous Internal Evaluation 2 (CIE-2)',
            eventType: 'CIE',
            startDate: '2026-11-20',
            endDate: '2026-11-22',
            date: '2026-11-20',
            daysLeft: 22,
            status: 'UPCOMING',
            shortDescription: 'Second assessment testing Modules 3 and 4 across 1st year foundational subjects.'
        };
    } else {
        // Generic template for other semesters
        events = SEMESTER_3_EVENTS.map((e, idx) => ({
            ...e,
            id: `demo-${sem}-${idx + 1}`,
            title: e.title.replace('3rd Semester', `Semester ${sem}`)
        }));
    }

    return {
        semester: sem,
        academicYear: '2026-27',
        branch: 'CSE',
        section: 'A',
        startDate,
        endDate,
        semesterProgressPercent: progressPercent,
        progress: {
            percentage: progressPercent,
            startDate,
            endDate,
            status: 'IN_PROGRESS'
        },
        upNextEvent: upNext,
        upNext,
        availableSemesters: DEMO_AVAILABLE_SEMESTERS,
        events
    };
}

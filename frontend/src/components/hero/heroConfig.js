/**
 * heroConfig.js
 * ─────────────────────────────────────────────────────────
 * Configuration and fallback datasets for AskUrSenior Hero Section.
 * Ensures zero hardcoding in UI components and instant rendering
 * even if backend APIs are loading or offline.
 * ─────────────────────────────────────────────────────────
 */

export const DEFAULT_HERO_CONTENT = {
    announcement: {
        badge: "✨ NEW",
        text: "Campus Explorer 3D Map is Live",
        href: "/campus-map",
        visible: true
    },
    heading: {
        line1: "Everything",
        line2: "Every",
        highlight: "SIT Student",
        line3: "Needs."
    },
    brandStatement: {
        prefix: "We share",
        highlight: "EXPERIENCE,",
        suffix: "not speculation."
    },
    description: "Access study materials, PYQs, interview experiences, AI assistance, campus tools, faculty information, and more—built specifically for SIT students.",
    primaryCTA: {
        label: "Start For Free",
        href: "/signup"
    },
    secondaryCTA: {
        label: "Explore AskUrSenior Plus",
        href: "/plus"
    }
};

export const DEFAULT_HERO_STATS = [
    { key: "resources", count: 355, label: "Resources", prefix: "✔ ", desc: "Notes, PYQs & Question Banks" },
    { key: "students", count: 900, label: "Students", prefix: "✔ ", desc: "Active SIT Learners" },
    { key: "companies", count: 12, label: "Companies", prefix: "✔ ", desc: "Interview Insights" },
    { key: "community", count: 2000, label: "2000+ Students", prefix: "whatsapp", desc: "WhatsApp Peer Network" }
];

export const SHOWCASE_TABS = [
    {
        id: 'ask_plus',
        title: 'Ask+ AI Assistant',
        subtitle: '24/7 Academic AI tuned for SIT syllabus & regulations',
        tag: 'AI POWERED',
        badgeColor: 'from-purple-500 to-indigo-500',
        metrics: '99.4% Accuracy'
    },
    {
        id: 'materials',
        title: 'Study Materials & PYQs',
        subtitle: 'Sorted by Semester, Subject, and Exam Type',
        tag: 'STUDY RESOURCES',
        badgeColor: 'from-indigo-500 to-blue-500',
        metrics: '100% Verified'
    },
    {
        id: 'interviews',
        title: 'Interview Experiences',
        subtitle: 'Real placement questions & round-by-round tips from seniors',
        tag: 'SENIOR TESTED',
        badgeColor: 'from-fuchsia-500 to-purple-500',
        metrics: 'SIT Companies'
    },
    {
        id: 'campus_map',
        title: 'Campus Explorer 3D',
        subtitle: 'Interactive 3D campus navigation with block search',
        tag: 'INTERACTIVE',
        badgeColor: 'from-emerald-500 to-teal-500',
        metrics: 'Live SIT Map'
    },
    {
        id: 'calculator',
        title: 'CGPA & CIE Calculator',
        subtitle: 'Calculate SGPA, target CIE marks & attendance safety',
        tag: 'ACCURATE',
        badgeColor: 'from-amber-500 to-orange-500',
        metrics: 'SIT Scheme Ready'
    }
];

export const DEFAULT_LIVE_ACTIVITIES = [
    {
        id: 'act-1',
        user: 'Rahul',
        action: 'downloaded',
        target: 'DBMS Module 3 Notes',
        timeAgo: 'Just now',
        type: 'download',
        icon: '📥',
        color: 'border-purple-500/30 text-purple-400 bg-purple-500/10'
    },
    {
        id: 'act-3',
        user: 'Karthik',
        action: 'searched',
        target: 'Campus Explorer',
        timeAgo: '4m ago',
        type: 'search',
        icon: '🔍',
        color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
    },
    {
        id: 'act-4',
        user: 'Ananya',
        action: 'calculated',
        target: 'CGPA & CIE Target',
        timeAgo: '7m ago',
        type: 'tool',
        icon: '📊',
        color: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
    },
    {
        id: 'act-5',
        user: 'Vikas',
        action: 'opened',
        target: 'Engineering Physics PYQ',
        timeAgo: '12m ago',
        type: 'download',
        icon: '📚',
        color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10'
    },
    {
        id: 'act-6',
        user: 'Sneha',
        action: 'asked Ask+',
        target: '"What happens if I become NE?"',
        timeAgo: '15m ago',
        type: 'ai',
        icon: '🤖',
        color: 'border-fuchsia-500/30 text-fuchsia-400 bg-fuchsia-500/10'
    }
];

export const REAL_COMPANIES_FEATURED = [
    "Amazon", "Infosys", "TCS", "Morgan Stanley", "Dish TV", "Wipro", "Bosch", "Accenture"
];

export const REAL_SUBJECTS_FEATURED = [
    "Engineering Physics", "Mathematics III", "Chemistry", "DBMS", "DSA", "Operating Systems"
];

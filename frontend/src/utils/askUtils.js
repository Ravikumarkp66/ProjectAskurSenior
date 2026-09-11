// Helper utilities for AskFinder & Study Materials
import { toBackendBranch, deriveBranchFromUSN } from './constants.js';

export const formatSize = (bytes) => {
    if (!bytes || isNaN(bytes) || bytes < 0) return '0.00 MB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

export const formatFileSize = formatSize;

export const getTimeAgo = (date) => {
    if (!date) return 'Recently';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Recently';

    const seconds = Math.floor((new Date() - d) / 1000);
    if (seconds < 0) return 'Just now';
    if (seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;

    const months = Math.floor(days / 30);
    if (months === 1) return '1 month ago';
    if (months < 12) return `${months} months ago`;

    const years = Math.floor(days / 365);
    if (years === 1) return '1 year ago';
    return `${years} years ago`;
};

export const formatFullDate = (date) => {
    if (!date) return '';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return '';
    }
};

export const isBranchMatch = (docBranch, targetBranch, targetYear) => {
    if (!targetBranch || targetBranch === 'ALL' || targetBranch === '') return true;
    if (targetYear === '1st Year') return true;
    if (!docBranch) return false;
    const b = docBranch.toUpperCase().trim();
    if (b === 'COMMON' || b === 'ALL' || b === 'GENERAL') return true;
    return toBackendBranch(docBranch) === toBackendBranch(targetBranch);
};

export const isYearMatch = (doc, targetYear) => {
    if (!targetYear) return true;
    const targetNum = targetYear.replace(/[^0-9]/g, '');

    // 1. Direct Year match on yearLevel
    const docYearNum = String(doc?.yearLevel || '').replace(/[^0-9]/g, '');
    if (docYearNum && targetNum && docYearNum === targetNum) return true;

    // 2. Year match on semester if it contains 'year'
    const docSem = String(doc?.semester || '').toLowerCase().trim();
    if (docSem.includes('year')) {
        const semYearNum = docSem.replace(/[^0-9]/g, '');
        if (semYearNum && targetNum && semYearNum === targetNum) return true;
        return false;
    }

    // 3. Semester to Year mapping (sem 1-2 -> 1st Year, 3-4 -> 2nd Year, 5-6 -> 3rd Year, 7-8 -> 4th Year)
    const semNum = parseInt(docSem.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(semNum) && targetNum) {
        if (targetNum === '1' && (semNum === 1 || semNum === 2)) return true;
        if (targetNum === '2' && (semNum === 3 || semNum === 4)) return true;
        if (targetNum === '3' && (semNum === 5 || semNum === 6)) return true;
        if (targetNum === '4' && (semNum === 7 || semNum === 8)) return true;
    }

    return false;
};

export const deriveStudentScope = (user) => {
    if (!user) return { branch: '', yearLevel: '', isScoped: false };

    let branch = '';
    if (user.branch) branch = toBackendBranch(user.branch);
    else if (user.academic?.branch) branch = toBackendBranch(user.academic.branch);
    else if (user.usn) {
        const b = deriveBranchFromUSN(user.usn);
        if (b) branch = toBackendBranch(b);
    }

    let yearLevel = '';
    if (user.yearLevel) {
        const num = String(user.yearLevel).replace(/[^1-4]/g, '');
        if (num) yearLevel = `${num}${num === '1' ? 'st' : num === '2' ? 'nd' : num === '3' ? 'rd' : 'th'} Year`;
    }
    if (!yearLevel && (user.semester || user.academic?.currentSemester)) {
        const sem = Number(user.semester || user.academic?.currentSemester);
        if (sem >= 1 && sem <= 2) yearLevel = '1st Year';
        else if (sem >= 3 && sem <= 4) yearLevel = '2nd Year';
        else if (sem >= 5 && sem <= 6) yearLevel = '3rd Year';
        else if (sem >= 7 && sem <= 8) yearLevel = '4th Year';
    }
    if (!yearLevel && user.usn) {
        const match = String(user.usn).match(/[a-zA-Z]{2,3}(\d{2})[a-zA-Z]{2,3}/);
        if (match && match[1]) {
            const admYear = 2000 + parseInt(match[1], 10);
            const curYear = new Date().getFullYear();
            const curMonth = new Date().getMonth();
            const diff = curYear - admYear;
            const estSem = (curMonth >= 7 || curMonth === 0) ? (diff * 2 + 1) : (diff * 2);
            if (estSem <= 2) yearLevel = '1st Year';
            else if (estSem <= 4) yearLevel = '2nd Year';
            else if (estSem <= 6) yearLevel = '3rd Year';
            else yearLevel = '4th Year';
        }
    }

    return {
        branch: branch || '',
        yearLevel: yearLevel || '',
        isScoped: !!(branch && yearLevel)
    };
};

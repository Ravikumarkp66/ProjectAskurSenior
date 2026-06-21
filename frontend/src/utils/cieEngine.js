// ─── Shared CIE Rule Engine ────────────────────────────────────────────────
// This module is the single source of truth for CIE calculation logic.
// It is used by both the Dashboard (SubjectCard) and the SGPA Calculator.

export const CIE_RULES = {
    IPCC: {
        name: '4 Credit IPCC',
        type: 'IPCC',
        theoryMax: 50,
        practicalMax: 25,
        theory: {
            tests: { count: 2, max: 100, reducedTo: 34, minTotal: 40 },
            quiz: { count: 2, max: 40, reducedTo: 8, minTotal: 16 },
            abl: { count: 2, max: 40, reducedTo: 8, minTotal: 16 }
        },
        practical: {
            record: { max: 350, reducedTo: 15, minTotal: 140 },
            test: { max: 15, reducedTo: 10, minTotal: 6 }
        },
        scaleTheoryTo: 25,
        minTotal: 20
    },
    THEORY_ONLY: {
        name: '3/4 Credit Theory Only',
        type: 'THEORY_ONLY',
        theoryMax: 50,
        practicalMax: 0,
        theory: {
            tests: { count: 2, max: 100, reducedTo: 34, minTotal: 40 },
            quiz: { count: 2, max: 40, reducedTo: 8, minTotal: 16 },
            abl: { count: 2, max: 40, reducedTo: 8, minTotal: 16 }
        },
        minTotal: 20
    },
    LAB_ONLY: {
        name: '1/2 Credit Lab Only',
        type: 'LAB_ONLY',
        theoryMax: 0,
        practicalMax: 50,
        practical: {
            record: { max: 350, reducedTo: 35, minTotal: 140 },
            test: { max: 15, reducedTo: 15, minTotal: 6 }
        },
        minTotal: 20
    },
    LOW_THEORY: {
        name: '1/2 Credit Theory',
        type: 'LOW_THEORY',
        theoryMax: 50,
        practicalMax: 0,
        theory: {
            tests: { count: 2, max: 100, reducedTo: 34, minTotal: 40 },
            internal: { count: 2, max: 40, reducedTo: 16, minTotal: 16 }
        },
        minTotal: 20
    }
};

/**
 * Determines the subject type based on credits and lab status.
 * Rules (VTU/SIT pattern):
 *   - 4 credits + has theory AND lab  → IPCC (Integrated Professional Core Course)
 *   - name contains 'lab' explicitly AND credits <= 2 → LAB_ONLY
 *   - credits >= 3, theory only       → THEORY_ONLY
 *   - credits <= 2, theory only       → LOW_THEORY
 */
export const detectSubjectType = (credits, hasLab, subjectName = '') => {
    const cr = parseFloat(credits) || 0;
    const nameLC = (subjectName || '').toLowerCase();
    // Explicit lab-only courses (name-based): labs, lab, practical
    const isExplicitLab = /\blab(oratory)?\b|\bpractical\b/.test(nameLC) && !nameLC.includes('theory');
    if (cr <= 2 && isExplicitLab) return 'LAB_ONLY';
    // 4-credit IPCC: theory + lab integrated (name does NOT end in 'lab')
    if (cr >= 4 && !isExplicitLab) return 'IPCC';
    // 4-credit lab-only edge case
    if (cr >= 4 && isExplicitLab) return 'LAB_ONLY';
    // 3-credit theory
    if (cr >= 3) return 'THEORY_ONLY';
    // 1-2 credit theory
    return 'LOW_THEORY';
};

/**
 * Calculates CIE from marks. Returns { cie, isEligible, components }
 * where components = { test, quiz, abl, labs, labTests } each = { score, max, pass }
 */
export const calculateCIEFromMarks = (cieMarks, credits, hasLab, subjectName = '') => {
    const m = cieMarks;
    const type = detectSubjectType(credits, hasLab, subjectName);
    const rule = CIE_RULES[type];

    const components = {};
    let theoryExact = 0;
    let practicalExact = 0;
    let isEligible = true;

    if (rule.theory?.tests) {
        const t1 = parseFloat(m.test1) || 0;
        const t2 = parseFloat(m.test2) || 0;
        const testSum = t1 + t2;
        const testReduced = (testSum / rule.theory.tests.max) * rule.theory.tests.reducedTo;
        const pass = testSum >= rule.theory.tests.minTotal;
        if (!pass) isEligible = false;
        theoryExact += testReduced;
        components.test = { score: testSum, max: rule.theory.tests.max, reduced: testReduced, reducedMax: rule.theory.tests.reducedTo, pass };
    }

    if (rule.theory?.quiz) {
        const q1 = parseFloat(m.quiz1) || 0;
        const q2 = parseFloat(m.quiz2) || 0;
        const quizSum = q1 + q2;
        const quizReduced = (quizSum / rule.theory.quiz.max) * rule.theory.quiz.reducedTo;
        const pass = quizSum >= rule.theory.quiz.minTotal;
        if (!pass) isEligible = false;
        theoryExact += quizReduced;
        components.quiz = { score: quizSum, max: rule.theory.quiz.max, reduced: quizReduced, reducedMax: rule.theory.quiz.reducedTo, pass };
    }

    if (rule.theory?.abl) {
        const a1 = parseFloat(m.abl1) || 0;
        const a2 = parseFloat(m.abl2) || 0;
        const ablSum = a1 + a2;
        const ablReduced = (ablSum / rule.theory.abl.max) * rule.theory.abl.reducedTo;
        const pass = ablSum >= rule.theory.abl.minTotal;
        if (!pass) isEligible = false;
        theoryExact += ablReduced;
        components.abl = { score: ablSum, max: rule.theory.abl.max, reduced: ablReduced, reducedMax: rule.theory.abl.reducedTo, pass };
    }

    if (rule.theory?.internal) {
        const q1 = parseFloat(m.quiz1) || 0;
        const a1 = parseFloat(m.abl1) || 0;
        const internalSum = q1 + a1;
        const internalReduced = (internalSum / rule.theory.internal.max) * rule.theory.internal.reducedTo;
        const pass = internalSum >= rule.theory.internal.minTotal;
        if (!pass) isEligible = false;
        theoryExact += internalReduced;
        components.internal = { score: internalSum, max: rule.theory.internal.max, reduced: internalReduced, reducedMax: rule.theory.internal.reducedTo, pass };
    }

    const theoryScaled = rule.scaleTheoryTo
        ? (theoryExact / (rule.theoryMax || 1)) * rule.scaleTheoryTo
        : theoryExact;

    if (rule.practical?.record) {
        const labs = Array.isArray(m.labs) ? m.labs : [''];
        const labSum = labs.reduce((s, v) => s + (parseFloat(v) || 0), 0);
        const labReduced = (labSum / rule.practical.record.max) * rule.practical.record.reducedTo;
        const pass = labSum >= rule.practical.record.minTotal;
        if (!pass) isEligible = false;
        practicalExact += labReduced;
        components.labs = { score: labSum, max: rule.practical.record.max, reduced: labReduced, reducedMax: rule.practical.record.reducedTo, pass };
    }

    if (rule.practical?.test) {
        const labTests = Array.isArray(m.labTests) ? m.labTests : [''];
        const testSumP = labTests.reduce((s, v) => s + (parseFloat(v) || 0), 0);
        const testReduced = (testSumP / (rule.practical.test.max * labTests.length)) * rule.practical.test.reducedTo;
        const pass = testSumP >= rule.practical.test.minTotal;
        if (!pass) isEligible = false;
        practicalExact += testReduced;
        components.labTests = { score: testSumP, max: rule.practical.test.max * labTests.length, reduced: testReduced, reducedMax: rule.practical.test.reducedTo, pass };
    }

    const cie = Math.round((theoryScaled + practicalExact) * 10) / 10;
    const cieMax = (rule.scaleTheoryTo || rule.theoryMax || 0) + (rule.practicalMax || 0);

    // Check minimum CIE
    if (cie < rule.minTotal) isEligible = false;

    return { cie, cieMax, isEligible, components, type, rule };
};

// ─── localStorage helpers ──────────────────────────────────────────────────

const getCIEResultKey = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user?.id || user?._id;
        return userId ? `cieResults_${userId}` : 'cieResults_guest';
    } catch {
        return 'cieResults_guest';
    }
};

/**
 * Save a single CIE result for a subject (keyed by subject code).
 */
export const saveCIEResult = (subjectCode, cie, isEligible, cieMarks) => {
    try {
        const key = getCIEResultKey();
        const existing = JSON.parse(localStorage.getItem(key) || '{}');
        existing[subjectCode] = { cie, isEligible, cieMarks, savedAt: Date.now() };
        localStorage.setItem(key, JSON.stringify(existing));
        window.dispatchEvent(new CustomEvent('cieResultsUpdated', { detail: { subjectCode, cie, isEligible } }));
    } catch {
        // ignore
    }
};

/**
 * Get all stored CIE results.
 */
export const getAllCIEResults = () => {
    try {
        const key = getCIEResultKey();
        return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
        return {};
    }
};

/**
 * Get CIE result for a specific subject code.
 */
export const getCIEResult = (subjectCode) => {
    return getAllCIEResults()[subjectCode] || null;
};

/**
 * Clear a single CIE result.
 */
export const clearCIEResult = (subjectCode) => {
    try {
        const key = getCIEResultKey();
        const existing = getAllCIEResults();
        delete existing[subjectCode];
        localStorage.setItem(key, JSON.stringify(existing));
        window.dispatchEvent(new CustomEvent('cieResultsUpdated', { detail: { subjectCode, cleared: true } }));
    } catch {
        // ignore
    }
};

// ─── Draft helpers (auto-save raw marks) ──────────────────────────────────

const getCIEDraftKey = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user?.id || user?._id;
        return userId ? `cieDrafts_${userId}` : 'cieDrafts_guest';
    } catch {
        return 'cieDrafts_guest';
    }
};

/**
 * Save raw marks as a draft (called on every change — no final CIE yet).
 */
export const saveCIEDraft = (subjectCode, marks) => {
    try {
        const key = getCIEDraftKey();
        const existing = JSON.parse(localStorage.getItem(key) || '{}');
        existing[subjectCode] = { marks, savedAt: Date.now() };
        localStorage.setItem(key, JSON.stringify(existing));
    } catch { /* ignore */ }
};

/**
 * Load a previously saved draft for a subject.
 */
export const getCIEDraft = (subjectCode) => {
    try {
        const key = getCIEDraftKey();
        const all = JSON.parse(localStorage.getItem(key) || '{}');
        return all[subjectCode]?.marks || null;
    } catch { return null; }
};

/**
 * Clear draft for a subject.
 */
export const clearCIEDraft = (subjectCode) => {
    try {
        const key = getCIEDraftKey();
        const existing = JSON.parse(localStorage.getItem(key) || '{}');
        delete existing[subjectCode];
        localStorage.setItem(key, JSON.stringify(existing));
    } catch { /* ignore */ }
};

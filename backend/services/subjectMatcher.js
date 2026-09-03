/**
 * Intelligent auto-matching service for uploaded material filenames against AcademicSubject catalog.
 */

const ACRONYM_MAP = {
  dsa: 'Data Structures',
  dbms: 'Database',
  os: 'Operating Systems',
  cn: 'Computer Networks',
  aiml: 'Artificial Intelligence',
  ai: 'Artificial Intelligence',
  ml: 'Machine Learning',
  se: 'Software Engineering',
  daa: 'Design and Analysis of Algorithms',
  toc: 'Theory of Computation',
  atc: 'Automata Theory',
  oops: 'Object Oriented Programming',
  java: 'Java',
  python: 'Python',
  web: 'Web Technology',
  cloud: 'Cloud Computing',
  iot: 'Internet of Things',
  dsp: 'Digital Signal Processing',
  aec: 'Analog Electronic Circuits',
  lic: 'Linear Integrated Circuits',
  ft: 'Field Theory',
  emw: 'Electromagnetic',
  ss: 'Soft Skills',
  evs: 'Environmental Studies',
  scr: 'Social Connect',
  rmipr: 'Research Methodology',
  uhv: 'Universal Human Values'
};

/**
 * Matches a filename to an AcademicSubject document from a list of subjects.
 * @param {string} filename - e.g. "dsa_unit1_notes.pdf"
 * @param {Array} subjectsList - pre-fetched array of AcademicSubject documents
 * @returns {Object|null} - { subject, migrationStatus: 'Auto Matched' } or null
 */
function matchSubject(filename, subjectsList) {
  if (!filename || !Array.isArray(subjectsList) || subjectsList.length === 0) {
    return null;
  }

  const clean = filename.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const tokens = clean.split(/\s+/).filter(Boolean);

  // 1. Exact Course Code match (e.g. "21CS32", "RMIPR", "HS06", "S4CCA01")
  for (const sub of subjectsList) {
    if (!sub.code) continue;
    const codeClean = sub.code.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (codeClean.length >= 3) {
      if (clean.includes(codeClean) || tokens.includes(sub.code.toLowerCase())) {
        return { subject: sub, migrationStatus: 'Auto Matched' };
      }
    }
  }

  // 2. Full Course Name substring match (e.g. "environmental studies", "biology for engineers")
  for (const sub of subjectsList) {
    if (!sub.name) continue;
    const nameClean = sub.name.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    if (nameClean.length >= 4 && clean.includes(nameClean)) {
      return { subject: sub, migrationStatus: 'Auto Matched' };
    }
  }

  // 3. Acronym token match
  for (const [acro, keyword] of Object.entries(ACRONYM_MAP)) {
    if (tokens.includes(acro)) {
      const found = subjectsList.find(
        (s) => s.name && s.name.toLowerCase().includes(keyword.toLowerCase())
      );
      if (found) {
        return { subject: found, migrationStatus: 'Auto Matched' };
      }
    }
  }

  return null;
}

/**
 * Automatically infers Material Type from filename keywords.
 * @param {string} filename
 * @returns {string} - 'Notes' | 'PYQs' | 'Question Banks' | 'Syllabus' | 'Lab Manuals' | 'Textbooks' | 'Others'
 */
function detectMaterialType(filename) {
  if (!filename) return 'Notes';
  const lower = filename.toLowerCase();

  if (/pyq|question[\s_\-]*paper|prev[\s_\-]*year|exam[\s_\-]*paper|model[\s_\-]*paper|see[\s_\-]*paper/i.test(lower)) {
    return 'PYQs';
  }
  if (/qb|question[\s_\-]*bank|important[\s_\-]*questions|questions/i.test(lower)) {
    return 'Question Banks';
  }
  if (/syllabus|curriculum|scheme/i.test(lower)) {
    return 'Syllabus';
  }
  if (/lab|manual|experiment|viva/i.test(lower)) {
    return 'Lab Manuals';
  }
  if (/textbook|book|reference[\s_\-]*book/i.test(lower)) {
    return 'Textbooks';
  }
  if (/notes|module|unit|lecture|handwritten/i.test(lower)) {
    return 'Notes';
  }

  return 'Notes';
}

module.exports = {
  matchSubject,
  detectMaterialType
};

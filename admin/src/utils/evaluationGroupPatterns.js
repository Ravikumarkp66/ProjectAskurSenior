/**
 * Evaluation Group Academic Patterns and Metadata
 * Defines contextual UI behaviors and academic templates for the 7 Scheme 2025 evaluation groups.
 */

export const PATTERN_KEYS = {
  STANDARD_THEORY: 'STANDARD_THEORY',
  AEC_THEORY: 'AEC_THEORY',
  NCMC: 'NCMC',
  INTEGRATED_IPCC: 'INTEGRATED_IPCC',
  STANDARD_LAB: 'STANDARD_LAB',
  PROJECT_SDC: 'PROJECT_SDC',
  CAED: 'CAED'
};

/**
 * Detect group academic pattern from group metadata
 */
export function detectGroupPattern(group) {
  if (!group || !group.name) return PATTERN_KEYS.STANDARD_THEORY;
  const name = group.name.toLowerCase();
  const cat = (group.category || '').toLowerCase();

  if (name.includes('ncmc') || name.includes('non-credit')) {
    return PATTERN_KEYS.NCMC;
  }
  if (name.includes('ipcc') || name.includes('integrated') || cat.includes('theory + lab')) {
    return PATTERN_KEYS.INTEGRATED_IPCC;
  }
  if (name.includes('sdc') || name.includes('project')) {
    return PATTERN_KEYS.PROJECT_SDC;
  }
  if (name.includes('caed') || cat === 'practical') {
    return PATTERN_KEYS.CAED;
  }
  if (name.includes('lab') || cat === 'lab only') {
    return PATTERN_KEYS.STANDARD_LAB;
  }
  if (name.includes('aec') || name.includes('ability')) {
    return PATTERN_KEYS.AEC_THEORY;
  }
  return PATTERN_KEYS.STANDARD_THEORY;
}

/**
 * Pattern-specific configuration and templates
 */
export const PATTERN_CONFIGS = {
  [PATTERN_KEYS.STANDARD_THEORY]: {
    key: PATTERN_KEYS.STANDARD_THEORY,
    title: 'Standard Theory',
    description: 'Lecture-based theory courses evaluated via CIE tests, quizzes, assignments and Theory SEE.',
    hasCie: true,
    hasSee: true,
    hasIpccSections: false,
    isRuntimeLabSession: false,
    isConfigurableComponents: false,
    resultType: 'MARK_RANGE',
    defaultContributesToSGPA: true,
    getDefaultTemplate: (group, scheme) => ({
      name: `${group?.name || 'Standard Theory'} Rule`,
      description: 'Standard Theory: 2 Tests (100->34), 2 Quizzes (40->8), 2 Assignments (40->8) = CIE 50. SEE 100->50.',
      contributesToSGPA: true,
      cie: {
        enabled: true,
        maxMarks: 50,
        passingMarks: 20,
        weightage: 50,
        components: [
          {
            key: 'THEORY_TEST',
            name: 'Internal Assessment Tests',
            type: 'ASSESSMENT',
            entryMode: 'COUNTED',
            entries: { count: 2, maxMarksEach: 50 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: true, sourceMax: 100, targetMax: 34 },
            order: 1
          },
          {
            key: 'THEORY_QUIZ',
            name: 'Quizzes',
            type: 'ASSESSMENT',
            entryMode: 'COUNTED',
            entries: { count: 2, maxMarksEach: 20 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: true, sourceMax: 40, targetMax: 8 },
            order: 2
          },
          {
            key: 'THEORY_ASSIGNMENT',
            name: 'Assignments / ABL',
            type: 'ASSESSMENT',
            entryMode: 'COUNTED',
            entries: { count: 2, maxMarksEach: 20 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: true, sourceMax: 40, targetMax: 8 },
            order: 3
          }
        ]
      },
      see: {
        enabled: true,
        maxMarks: 50,
        passingMarks: 18,
        weightage: 50,
        components: [
          {
            key: 'THEORY_SEE',
            name: 'Theory Semester End Exam',
            type: 'THEORY_EXAM',
            entryMode: 'COUNTED',
            entries: { count: 1, maxMarksEach: 100 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: true, sourceMax: 100, targetMax: 50 },
            order: 1
          }
        ]
      },
      eligibility: {
        enabled: true,
        operator: 'AND',
        conditions: [
          { type: 'CIE_MIN', value: 20, description: 'Minimum 20/50 in CIE' },
          { type: 'SEE_MIN', value: 18, description: 'Minimum 18/50 in SEE' },
          { type: 'AGGREGATE_MIN', value: 40, description: 'Minimum 40/100 Aggregate Total' },
          { type: 'ATTENDANCE_MIN', value: 85, description: 'Minimum 85% Attendance' }
        ]
      },
      gradeScale: {
        enabled: true,
        type: 'MARK_RANGE',
        grades: [
          { grade: 'O', minMarks: 90, maxMarks: 100, gradePoint: 10, order: 1 },
          { grade: 'A+', minMarks: 80, maxMarks: 89.99, gradePoint: 9, order: 2 },
          { grade: 'A', minMarks: 70, maxMarks: 79.99, gradePoint: 8, order: 3 },
          { grade: 'B+', minMarks: 60, maxMarks: 69.99, gradePoint: 7, order: 4 },
          { grade: 'B', minMarks: 50, maxMarks: 59.99, gradePoint: 6, order: 5 },
          { grade: 'C', minMarks: 40, maxMarks: 49.99, gradePoint: 5, order: 6 },
          { grade: 'F', minMarks: 0, maxMarks: 39.99, gradePoint: 0, order: 7 }
        ]
      }
    })
  },

  [PATTERN_KEYS.AEC_THEORY]: {
    key: PATTERN_KEYS.AEC_THEORY,
    title: 'AEC Theory',
    description: 'Ability Enhancement Course (1-credit): Tests (2 × 50 = 100 -> 34), Quiz / MCQ (1 × 20 = 20 -> 8), Task / Assignment (1 × 20 = 20 -> 8) = CIE 50. Theory / MCQ SEE = 50 direct.',
    hasCie: true,
    hasSee: true,
    hasIpccSections: false,
    isRuntimeLabSession: false,
    isConfigurableComponents: false,
    resultType: 'MARK_RANGE',
    defaultContributesToSGPA: true,
    getDefaultTemplate: (group, scheme) => ({
      name: `${group?.name || 'AEC Theory'} Rule`,
      description: 'AEC Theory: Tests (2 × 50 = 100 -> 34) + Quiz / Assignment (1 × 20 = 20 -> 16) = CIE 50. Theory / MCQ Examination = 50 direct.',
      contributesToSGPA: true,
      cie: {
        enabled: true,
        maxMarks: 50,
        passingMarks: 20,
        weightage: 50,
        components: [
          {
            key: 'AEC_TEST',
            name: 'Internal Assessment Tests',
            type: 'ASSESSMENT',
            entryMode: 'COUNTED',
            entries: { count: 2, maxMarksEach: 50 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: true, sourceMax: 100, targetMax: 34 },
            order: 1
          },
          {
            key: 'AEC_QUIZ_ASSIGNMENT',
            name: 'Quiz / Assignment',
            type: 'ASSESSMENT',
            entryMode: 'COUNTED',
            entries: { count: 1, maxMarksEach: 20 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: true, sourceMax: 20, targetMax: 16 },
            order: 2
          }
        ]
      },
      see: {
        enabled: true,
        maxMarks: 50,
        passingMarks: 18,
        weightage: 50,
        components: [
          {
            key: 'AEC_SEE',
            name: 'Theory / MCQ Examination',
            type: 'THEORY_EXAM',
            entryMode: 'COUNTED',
            entries: { count: 1, maxMarksEach: 50 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: false, sourceMax: 50, targetMax: 50 },
            order: 1
          }
        ]
      },
      eligibility: {
        enabled: true,
        operator: 'AND',
        conditions: [
          { type: 'CIE_MIN', value: 20, unit: 'MARKS', description: 'CIE >= 20 / 50' },
          { type: 'ATTENDANCE_MIN', value: 85, unit: 'PERCENTAGE', description: 'Attendance >= 85%' },
          { type: 'SEE_MIN', value: 18, unit: 'MARKS', description: 'SEE >= 18 / 50' },
          { type: 'AGGREGATE_MIN', value: 40, unit: 'MARKS', description: 'Aggregate >= 40 / 100' }
        ]
      },
      gradeScale: {
        enabled: true,
        type: 'MARK_RANGE',
        grades: [
          { grade: 'O', minMarks: 90, maxMarks: 100, gradePoint: 10, order: 1 },
          { grade: 'A+', minMarks: 80, maxMarks: 89.99, gradePoint: 9, order: 2 },
          { grade: 'A', minMarks: 70, maxMarks: 79.99, gradePoint: 8, order: 3 },
          { grade: 'B+', minMarks: 60, maxMarks: 69.99, gradePoint: 7, order: 4 },
          { grade: 'B', minMarks: 50, maxMarks: 59.99, gradePoint: 6, order: 5 },
          { grade: 'C', minMarks: 40, maxMarks: 49.99, gradePoint: 5, order: 6 },
          { grade: 'F', minMarks: 0, maxMarks: 39.99, gradePoint: 0, order: 7 }
        ]
      }
    })
  },

  [PATTERN_KEYS.NCMC]: {
    key: PATTERN_KEYS.NCMC,
    title: 'NCMC Non-Credit',
    description: 'Non-Credit Mandatory Course: Evaluated purely via CIE (100). SEE is Disabled. Result is PP/NP. Excluded from SGPA.',
    hasCie: true,
    hasSee: false, // SEE Disabled
    hasIpccSections: false,
    isRuntimeLabSession: false,
    isConfigurableComponents: false,
    resultType: 'PASS_FAIL',
    defaultContributesToSGPA: false,
    getDefaultTemplate: (group, scheme) => ({
      name: `${group?.name || 'NCMC'} Rule`,
      description: 'NCMC Non-Credit: CIE 100 (completion mandatory, no numeric pass threshold), SEE Disabled, PP/NP result, Excluded from SGPA.',
      contributesToSGPA: false,
      cie: {
        enabled: true,
        maxMarks: 100,
        passingMarks: 0,
        weightage: 100,
        components: [
          {
            key: 'NCMC_CIE',
            name: 'Continuous Internal Evaluation',
            type: 'ASSESSMENT',
            entryMode: 'COUNTED',
            entries: { count: 1, maxMarksEach: 100 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: false, sourceMax: 100, targetMax: 100 },
            order: 1
          }
        ]
      },
      see: {
        enabled: false,
        maxMarks: 0,
        passingMarks: 0,
        weightage: 0,
        components: []
      },
      eligibility: {
        enabled: false,
        operator: 'AND',
        conditions: []
      },
      gradeScale: {
        enabled: true,
        type: 'PASS_FAIL',
        grades: [
          { grade: 'PP', minMarks: 0, maxMarks: 100, gradePoint: 0, order: 1 },
          { grade: 'NP', minMarks: 0, maxMarks: 0, gradePoint: 0, order: 2 }
        ]
      }
    })
  },

  [PATTERN_KEYS.INTEGRATED_IPCC]: {
    key: PATTERN_KEYS.INTEGRATED_IPCC,
    title: 'Integrated IPCC',
    description: 'Integrated Professional Core Course: Dual CIE components (Theory CIE 25 + Practical CIE 25 = Final CIE 50). Integrated written SEE 50.',
    hasCie: true,
    hasSee: true,
    hasIpccSections: true, // Partitioned Theory + Practical
    isRuntimeLabSession: false,
    isConfigurableComponents: false,
    resultType: 'MARK_RANGE',
    defaultContributesToSGPA: true,
    getDefaultTemplate: (group, scheme) => ({
      name: `${group?.name || 'Integrated IPCC'} Rule`,
      description: 'IPCC: Theory CIE (50->25) + Practical CIE (25) = 50. Written SEE (100->50). Dual component eligibility.',
      contributesToSGPA: true,
      cie: {
        enabled: true,
        maxMarks: 50,
        passingMarks: 20,
        weightage: 50,
        components: [
          // Theory Sub-component (25 marks effective: 17 + 4 + 4)
          {
            key: 'IPCC_THEORY_TEST',
            name: 'Theory: Internal Tests',
            type: 'ASSESSMENT',
            entryMode: 'COUNTED',
            entries: { count: 2, maxMarksEach: 50 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: true, sourceMax: 100, targetMax: 17 },
            order: 1
          },
          {
            key: 'IPCC_THEORY_QUIZ',
            name: 'Theory: Quizzes',
            type: 'ASSESSMENT',
            entryMode: 'COUNTED',
            entries: { count: 2, maxMarksEach: 20 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: true, sourceMax: 40, targetMax: 4 },
            order: 2
          },
          {
            key: 'IPCC_THEORY_ASSIGNMENT',
            name: 'Theory: Assignments / ABL',
            type: 'ASSESSMENT',
            entryMode: 'COUNTED',
            entries: { count: 2, maxMarksEach: 20 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: true, sourceMax: 40, targetMax: 4 },
            order: 3
          },
          // Practical Sub-component (25 marks: 15 + 10)
          {
            key: 'IPCC_LAB_CONDUCTION',
            name: 'Practical: Lab Conduction & Record',
            type: 'LAB_RECORD',
            entryMode: 'COUNTED',
            entries: { count: 1, maxMarksEach: 350 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: true, sourceMax: 350, targetMax: 15 },
            order: 4
          },
          {
            key: 'IPCC_LAB_TEST',
            name: 'Practical: Lab Internal Test',
            type: 'LAB_TEST',
            entryMode: 'COUNTED',
            entries: { count: 1, maxMarksEach: 15 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: true, sourceMax: 15, targetMax: 10 },
            order: 5
          }
        ]
      },
      see: {
        enabled: true,
        maxMarks: 50,
        passingMarks: 18,
        weightage: 50,
        components: [
          {
            key: 'IPCC_SEE',
            name: 'Integrated Written Examination',
            type: 'THEORY_EXAM',
            entryMode: 'COUNTED',
            entries: { count: 1, maxMarksEach: 100 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: true, sourceMax: 100, targetMax: 50 },
            order: 1
          }
        ]
      },
      eligibility: {
        enabled: true,
        operator: 'AND',
        conditions: [
          { type: 'COMPONENT_MIN', componentKey: 'IPCC_THEORY_TEST', value: 10, description: 'Minimum 10/25 in Theory CIE Subtotal' },
          { type: 'COMPONENT_MIN', componentKey: 'IPCC_LAB_TEST', value: 10, description: 'Minimum 10/25 in Practical CIE Subtotal' },
          { type: 'CIE_MIN', value: 20, description: 'Minimum 20/50 in Overall CIE' },
          { type: 'SEE_MIN', value: 18, description: 'Minimum 18/50 in Integrated Written SEE' },
          { type: 'AGGREGATE_MIN', value: 40, description: 'Minimum 40/100 Aggregate Total' },
          { type: 'ATTENDANCE_MIN', value: 85, description: 'Minimum 85% Attendance' }
        ]
      },
      gradeScale: {
        enabled: true,
        type: 'MARK_RANGE',
        grades: [
          { grade: 'O', minMarks: 90, maxMarks: 100, gradePoint: 10, order: 1 },
          { grade: 'A+', minMarks: 80, maxMarks: 89.99, gradePoint: 9, order: 2 },
          { grade: 'A', minMarks: 70, maxMarks: 79.99, gradePoint: 8, order: 3 },
          { grade: 'B+', minMarks: 60, maxMarks: 69.99, gradePoint: 7, order: 4 },
          { grade: 'B', minMarks: 50, maxMarks: 59.99, gradePoint: 6, order: 5 },
          { grade: 'C', minMarks: 40, maxMarks: 49.99, gradePoint: 5, order: 6 },
          { grade: 'F', minMarks: 0, maxMarks: 39.99, gradePoint: 0, order: 7 }
        ]
      }
    })
  },

  [PATTERN_KEYS.STANDARD_LAB]: {
    key: PATTERN_KEYS.STANDARD_LAB,
    title: 'Standard Laboratory',
    description: 'Practical Lab Courses (1-credit): Lab Conduction (35 marks/session runtime -> 35), Lab Internal Test & Viva (15) = CIE 50. Practical Exam SEE 50.',
    hasCie: true,
    hasSee: true,
    hasIpccSections: false,
    isRuntimeLabSession: true, // Runtime session count N (not fixed rule)
    isConfigurableComponents: false,
    resultType: 'MARK_RANGE',
    defaultContributesToSGPA: true,
    getDefaultTemplate: (group, scheme) => ({
      name: `${group?.name || 'Standard Laboratory'} Rule`,
      description: 'Standard Lab: Continuous Lab Conduction (N×35->35 where N is runtime section data) + Lab Test & Viva (15->15) = CIE 50. Practical SEE 50.',
      contributesToSGPA: true,
      cie: {
        enabled: true,
        maxMarks: 50,
        passingMarks: 20,
        weightage: 50,
        components: [
          {
            key: 'LAB_CONDUCTION',
            name: 'Continuous Lab Conduction & Record',
            type: 'LAB_RECORD',
            entryMode: 'COUNTED',
            entries: { count: 1, maxMarksEach: 35 }, // Baseline unit: 35 per session
            aggregation: { method: 'SUM' },
            conversion: { enabled: true, sourceMax: 35, targetMax: 35 },
            order: 1
          },
          {
            key: 'LAB_TEST',
            name: 'Lab Internal Test & Viva Voce',
            type: 'LAB_TEST',
            entryMode: 'COUNTED',
            entries: { count: 1, maxMarksEach: 15 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: false, sourceMax: 15, targetMax: 15 },
            order: 2
          }
        ]
      },
      see: {
        enabled: true,
        maxMarks: 50,
        passingMarks: 18,
        weightage: 50,
        components: [
          {
            key: 'LAB_SEE',
            name: 'Practical Laboratory Examination',
            type: 'PRACTICAL_EXAM',
            entryMode: 'COUNTED',
            entries: { count: 1, maxMarksEach: 50 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: false, sourceMax: 50, targetMax: 50 },
            order: 1
          }
        ]
      },
      eligibility: {
        enabled: true,
        operator: 'AND',
        conditions: [
          { type: 'CIE_MIN', value: 20, unit: 'MARKS', description: 'CIE >= 20 / 50' },
          { type: 'ATTENDANCE_MIN', value: 85, unit: 'PERCENTAGE', description: 'Attendance >= 85%' },
          { type: 'SEE_MIN', value: 18, unit: 'MARKS', description: 'SEE >= 18 / 50' },
          { type: 'AGGREGATE_MIN', value: 40, unit: 'MARKS', description: 'Aggregate >= 40 / 100' }
        ]
      },
      gradeScale: {
        enabled: true,
        type: 'MARK_RANGE',
        grades: [
          { grade: 'O', minMarks: 90, maxMarks: 100, gradePoint: 10, order: 1 },
          { grade: 'A+', minMarks: 80, maxMarks: 89.99, gradePoint: 9, order: 2 },
          { grade: 'A', minMarks: 70, maxMarks: 79.99, gradePoint: 8, order: 3 },
          { grade: 'B+', minMarks: 60, maxMarks: 69.99, gradePoint: 7, order: 4 },
          { grade: 'B', minMarks: 50, maxMarks: 59.99, gradePoint: 6, order: 5 },
          { grade: 'C', minMarks: 40, maxMarks: 49.99, gradePoint: 5, order: 6 },
          { grade: 'F', minMarks: 0, maxMarks: 39.99, gradePoint: 0, order: 7 }
        ]
      }
    })
  },

  [PATTERN_KEYS.PROJECT_SDC]: {
    key: PATTERN_KEYS.PROJECT_SDC,
    title: 'Project-Based SDC',
    description: 'Skill Development Courses: Project-oriented evaluation shell. Configurable project components (CIE target 50) and SEE target 50.',
    hasCie: true,
    hasSee: true,
    hasIpccSections: false,
    isRuntimeLabSession: false,
    isConfigurableComponents: true, // Dynamic + Add Component
    resultType: 'MARK_RANGE',
    defaultContributesToSGPA: true,
    getDefaultTemplate: (group, scheme) => ({
      name: `${group?.name || 'Project-Based SDC'} Rule`,
      description: 'Project-Based SDC: Configurable project evaluation shell. CIE target 50, SEE target 50.',
      contributesToSGPA: true,
      cie: {
        enabled: true,
        maxMarks: 50,
        passingMarks: 20,
        weightage: 50,
        components: []
      },
      see: {
        enabled: true,
        maxMarks: 50,
        passingMarks: 18,
        weightage: 50,
        components: [
          {
            key: 'SDC_SEE',
            name: 'Project Demonstration, Exhibition & Viva Voce',
            type: 'PRACTICAL_EXAM',
            entryMode: 'COUNTED',
            entries: { count: 1, maxMarksEach: 50 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: false, sourceMax: 50, targetMax: 50 },
            order: 1
          }
        ]
      },
      eligibility: {
        enabled: true,
        operator: 'AND',
        conditions: [
          { type: 'CIE_MIN', value: 20, unit: 'MARKS', description: 'CIE >= 20 / 50' },
          { type: 'ATTENDANCE_MIN', value: 85, unit: 'PERCENTAGE', description: 'Attendance >= 85%' },
          { type: 'SEE_MIN', value: 18, unit: 'MARKS', description: 'SEE >= 18 / 50' },
          { type: 'AGGREGATE_MIN', value: 40, unit: 'MARKS', description: 'Aggregate >= 40 / 100' }
        ]
      },
      gradeScale: {
        enabled: true,
        type: 'MARK_RANGE',
        grades: [
          { grade: 'O', minMarks: 90, maxMarks: 100, gradePoint: 10, order: 1 },
          { grade: 'A+', minMarks: 80, maxMarks: 89.99, gradePoint: 9, order: 2 },
          { grade: 'A', minMarks: 70, maxMarks: 79.99, gradePoint: 8, order: 3 },
          { grade: 'B+', minMarks: 60, maxMarks: 69.99, gradePoint: 7, order: 4 },
          { grade: 'B', minMarks: 50, maxMarks: 59.99, gradePoint: 6, order: 5 },
          { grade: 'C', minMarks: 40, maxMarks: 49.99, gradePoint: 5, order: 6 },
          { grade: 'F', minMarks: 0, maxMarks: 39.99, gradePoint: 0, order: 7 }
        ]
      }
    })
  },

  [PATTERN_KEYS.CAED]: {
    key: PATTERN_KEYS.CAED,
    title: 'CAED Practical',
    description: 'Computer Aided Engineering Drawing (3 credits, Practical category): Dedicated practical evaluation shell. Configurable CIE target 50 and SEE target 50.',
    hasCie: true,
    hasSee: true,
    hasIpccSections: false,
    isRuntimeLabSession: false,
    isConfigurableComponents: true, // Dynamic + Add Component
    resultType: 'MARK_RANGE',
    defaultContributesToSGPA: true,
    getDefaultTemplate: (group, scheme) => ({
      name: `${group?.name || 'CAED Practical'} Rule`,
      description: 'CAED Practical: Dedicated practical evaluation rule with configurable drafting/practical components. CIE target 50, SEE target 50.',
      contributesToSGPA: true,
      cie: {
        enabled: true,
        maxMarks: 50,
        passingMarks: 20,
        weightage: 50,
        components: [
          {
            key: 'CAED_CLASSWORK',
            name: 'Classwork: Sketchbook & CAD Printouts',
            type: 'ASSESSMENT',
            entryMode: 'COUNTED',
            entries: { count: 1, maxMarksEach: 80 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: true, sourceMax: 80, targetMax: 20 },
            order: 1
          },
          {
            key: 'CAED_EL',
            name: 'Experiential Learning',
            type: 'ASSESSMENT',
            entryMode: 'COUNTED',
            entries: { count: 1, maxMarksEach: 20 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: true, sourceMax: 20, targetMax: 10 },
            order: 2
          },
          {
            key: 'CAED_TESTS',
            name: 'CAD & Manual Tests',
            type: 'ASSESSMENT',
            entryMode: 'COUNTED',
            entries: { count: 2, maxMarksEach: 50 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: true, sourceMax: 100, targetMax: 20 },
            order: 3
          }
        ]
      },
      see: {
        enabled: true,
        maxMarks: 50,
        passingMarks: 18,
        weightage: 50,
        components: [
          {
            key: 'CAED_SEE',
            name: 'CAD Practical Examination',
            type: 'PRACTICAL_EXAM',
            entryMode: 'COUNTED',
            entries: { count: 1, maxMarksEach: 50 },
            aggregation: { method: 'SUM' },
            conversion: { enabled: false, sourceMax: 50, targetMax: 50 },
            order: 1
          }
        ]
      },
      eligibility: {
        enabled: true,
        operator: 'AND',
        conditions: [
          { type: 'CIE_MIN', value: 20, unit: 'MARKS', description: 'CIE >= 20 / 50' },
          { type: 'ATTENDANCE_MIN', value: 85, unit: 'PERCENTAGE', description: 'Attendance >= 85%' },
          { type: 'SEE_MIN', value: 18, unit: 'MARKS', description: 'SEE >= 18 / 50' },
          { type: 'AGGREGATE_MIN', value: 40, unit: 'MARKS', description: 'Aggregate >= 40 / 100' }
        ]
      },
      gradeScale: {
        enabled: true,
        type: 'MARK_RANGE',
        grades: [
          { grade: 'O', minMarks: 90, maxMarks: 100, gradePoint: 10, order: 1 },
          { grade: 'A+', minMarks: 80, maxMarks: 89.99, gradePoint: 9, order: 2 },
          { grade: 'A', minMarks: 70, maxMarks: 79.99, gradePoint: 8, order: 3 },
          { grade: 'B+', minMarks: 60, maxMarks: 69.99, gradePoint: 7, order: 4 },
          { grade: 'B', minMarks: 50, maxMarks: 59.99, gradePoint: 6, order: 5 },
          { grade: 'C', minMarks: 40, maxMarks: 49.99, gradePoint: 5, order: 6 },
          { grade: 'F', minMarks: 0, maxMarks: 39.99, gradePoint: 0, order: 7 }
        ]
      }
    })
  }
};

/**
 * Profile Feature Shared Entity Contracts
 * 
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} [usn]
 * @property {string} [branch]
 * @property {number} [semester]
 * @property {string} [avatar]
 * 
 * @typedef {Object} AcademicInfo
 * @property {string} branch
 * @property {number} semester
 * @property {string} [scheme]
 * 
 * @typedef {Object} AttendanceSummary
 * @property {number} overallPercentage
 * @property {number} totalAttended
 * @property {number} totalConducted
 * @property {Array} subjects
 * 
 * @typedef {Object} CGPARecord
 * @property {number} targetCgpa
 * @property {number} currentCgpa
 * @property {Array} semesterGpas
 */

export const ProfileSchemas = {};

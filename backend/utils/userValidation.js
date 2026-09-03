/**
 * Canonical AskUrSenior User Validation and Normalization Helpers
 */

/**
 * Normalizes email: trim whitespace and lowercase
 */
const normalizeEmail = (email) => {
    if (!email || typeof email !== 'string') return '';
    return email.trim().toLowerCase();
};

/**
 * Validates standard email format
 */
const validateEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim().toLowerCase());
};

/**
 * Normalizes name:
 * 1. Trim leading/trailing whitespace
 * 2. Collapse multiple spaces into a single space
 * 3. Convert to lowercase
 */
const normalizeName = (name) => {
    if (!name || typeof name !== 'string') return '';
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
};

/**
 * Validates canonical AskUrSenior user name:
 * - Lowercase alphabetic characters and single spaces between words only
 * - Matches ^[a-z]+(?: [a-z]+)*$
 * - Length between 2 and 50 characters
 */
const validateName = (name) => {
    if (!name || typeof name !== 'string') return false;
    const normalized = normalizeName(name);
    if (normalized.length < 2 || normalized.length > 50) return false;
    const nameRegex = /^[a-z]+(?: [a-z]+)*$/;
    return nameRegex.test(normalized);
};

/**
 * Normalizes USN: trim whitespace and uppercase
 */
const normalizeUsn = (usn) => {
    if (!usn || typeof usn !== 'string') return '';
    return usn.trim().toUpperCase();
};

/**
 * Validates USN format:
 * VTU standard format: 1[A-Z]{2}\d{2}[A-Z]{2,3}\d{3} e.g. 1SI23IS080
 * Also permits 8 to 12 alphanumeric characters
 */
const validateUsn = (usn) => {
    if (!usn || typeof usn !== 'string') return false;
    const normalized = normalizeUsn(usn);
    if (normalized.length < 8 || normalized.length > 12) return false;
    const usnRegex = /^[1-4][A-Z]{2}\d{2}[A-Z]{2,3}\d{3}$/;
    const genericAlphanumericRegex = /^[A-Z0-9]{8,12}$/;
    return usnRegex.test(normalized) || genericAlphanumericRegex.test(normalized);
};

/**
 * Checks if a field is empty, null, or whitespace-only
 */
const isEmptyField = (val) => {
    if (val === null || val === undefined) return true;
    if (typeof val === 'string') return val.trim().length === 0;
    return false;
};

/**
 * Returns an array of missing canonical profile fields
 */
const getMissingProfileFields = (user) => {
    if (!user || typeof user !== 'object') return ['Name', 'USN', 'Email', 'College', 'Branch', 'Scheme', 'Semester', 'DOB', 'Phone'];
    const missing = [];

    if (!validateName(user.name)) missing.push('Name');
    if (!validateUsn(user.usn)) missing.push('USN');
    if (!validateEmail(user.email)) missing.push('Email');
    if (isEmptyField(user.collegeName) && isEmptyField(user.college)) missing.push('College');
    if (isEmptyField(user.branchName) && isEmptyField(user.branch) && isEmptyField(user.currentBranch)) missing.push('Branch');
    if (isEmptyField(user.schemeName) && isEmptyField(user.scheme)) missing.push('Scheme');
    if (!user.semester || user.semester < 1 || user.semester > 8) missing.push('Semester');
    if (!user.dob || isNaN(new Date(user.dob).getTime())) missing.push('DOB');
    if (isEmptyField(user.phone)) missing.push('Phone');

    return missing;
};

/**
 * Determines whether a user's profile is complete:
 * Checks all canonical identity and academic fields
 */
const isProfileComplete = (user) => {
    if (!user || typeof user !== 'object') return false;
    return getMissingProfileFields(user).length === 0;
};

/**
 * Checks whether the user has recorded any active session
 */
const isNeverActive = (user) => {
    if (!user || typeof user !== 'object') return true;
    const lastActive = user.lastActive || user.lastActiveAt;
    return isEmptyField(lastActive);
};

module.exports = {
    normalizeEmail,
    validateEmail,
    normalizeName,
    validateName,
    normalizeUsn,
    validateUsn,
    isEmptyField,
    getMissingProfileFields,
    isProfileComplete,
    isNeverActive
};

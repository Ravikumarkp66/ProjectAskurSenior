/**
 * AskUrSenior Admin User Validation and Filter Helpers
 */
import {
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
} from '../../../frontend/src/utils/userValidation';

export {
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

/**
 * Returns true if at least one required canonical profile field is missing or invalid
 */
export const isIncompleteProfile = (user) => {
  return !isProfileComplete(user);
};

export default {
  normalizeEmail,
  validateEmail,
  normalizeName,
  validateName,
  normalizeUsn,
  validateUsn,
  isEmptyField,
  isProfileComplete,
  isNeverActive,
  getMissingProfileFields,
  isIncompleteProfile
};

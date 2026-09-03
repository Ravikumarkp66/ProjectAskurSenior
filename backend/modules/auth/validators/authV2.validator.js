const { body, validationResult } = require('express-validator');
const {
    normalizeEmail,
    validateName,
    normalizeName,
    validateUsn,
    normalizeUsn
} = require('../../../utils/userValidation');

const validateEmailLogin = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .customSanitizer(normalizeEmail),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                data: null,
                errors: errors.mapped()
            });
        }
        next();
    }
];

const validateVerifyOtp = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .customSanitizer(normalizeEmail),
    body('otp')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be exactly 6 digits')
        .isNumeric()
        .withMessage('OTP must contain only numbers'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                data: null,
                errors: errors.mapped()
            });
        }
        next();
    }
];

const validateRegister = [
    body('registrationToken')
        .notEmpty()
        .withMessage('registrationToken is required')
        .isString()
        .withMessage('registrationToken must be a string'),
    body('name')
        .notEmpty()
        .withMessage('Name is required')
        .customSanitizer(normalizeName)
        .custom((value) => {
            if (!validateName(value)) {
                throw new Error('Name must contain only lowercase English letters and single spaces between words (2-50 characters)');
            }
            return true;
        }),
    body('usn')
        .notEmpty()
        .withMessage('USN is required')
        .customSanitizer(normalizeUsn)
        .custom((value) => {
            if (!validateUsn(value)) {
                throw new Error('Invalid USN format (e.g. 1SI23IS080)');
            }
            return true;
        }),
    body('graduationYear')
        .optional({ checkFalsy: true })
        .isInt({ min: 2020, max: 2040 })
        .withMessage('Graduation year must be a valid year (2020-2040)'),
    body('collegeName')
        .optional({ checkFalsy: true })
        .trim(),
    body('branch')
        .optional({ checkFalsy: true }),
    body('scheme')
        .optional({ checkFalsy: true }),
    body('phone')
        .optional({ checkFalsy: true })
        .trim(),
    body('dob')
        .optional({ checkFalsy: true })
        .trim(),
    body('semester')
        .optional({ checkFalsy: true })
        .isInt({ min: 1, max: 8 })
        .withMessage('Semester must be between 1 and 8'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                data: null,
                errors: errors.mapped()
            });
        }
        next();
    }
];

const validateCheckUsn = [
    body('usn')
        .notEmpty()
        .withMessage('USN is required')
        .customSanitizer(normalizeUsn)
        .custom((value) => {
            if (!validateUsn(value)) {
                throw new Error('Invalid USN format (e.g. 1SI23IS080)');
            }
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                data: null,
                errors: errors.mapped()
            });
        }
        next();
    }
];

module.exports = {
    validateEmailLogin,
    validateVerifyOtp,
    validateRegister,
    validateCheckUsn
};

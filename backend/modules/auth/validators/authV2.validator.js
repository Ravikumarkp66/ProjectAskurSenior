const { body, validationResult } = require('express-validator');

const validateEmailLogin = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .trim()
        .toLowerCase(),
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
        .trim()
        .toLowerCase(),
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
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .trim(),
    body('usn')
        .notEmpty()
        .withMessage('USN is required')
        .isLength({ min: 8, max: 12 })
        .withMessage('USN must be between 8 and 12 characters')
        .matches(/^[1-4][a-zA-Z]{2}[0-9]{2}[a-zA-Z]{2,3}[0-9]{3}$/)
        .withMessage('Invalid USN format')
        .trim()
        .toUpperCase(),
    body('graduationYear')
        .notEmpty()
        .withMessage('Graduation year is required')
        .isInt({ min: 2020, max: 2040 })
        .withMessage('Graduation year must be a valid year (2020-2040)'),
    body('collegeName')
        .notEmpty()
        .withMessage('College name is required')
        .trim(),
    body('branch')
        .notEmpty()
        .withMessage('Branch is required')
        .isMongoId()
        .withMessage('Invalid branch ID'),
    body('scheme')
        .notEmpty()
        .withMessage('Scheme is required')
        .isMongoId()
        .withMessage('Invalid scheme ID'),
    body('phone')
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^\+[1-9]\d{1,14}$/)
        .withMessage('Phone number must be in E.164 format (e.g. +919876543210)')
        .trim(),
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
        .isLength({ min: 8, max: 12 })
        .withMessage('USN must be between 8 and 12 characters')
        .matches(/^[1-4][a-zA-Z]{2}[0-9]{2}[a-zA-Z]{2,3}[0-9]{3}$/)
        .withMessage('Invalid USN format')
        .trim()
        .toUpperCase(),
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

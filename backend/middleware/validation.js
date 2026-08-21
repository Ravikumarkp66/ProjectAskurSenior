/**
 * Request Validation Middleware Layer
 * Decouples request payload validation from controller & service business logic.
 */

const validateRegister = (req, res, next) => {
    const { usn, email, password, branch } = req.body;

    if (!usn || !email || !password || !branch) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (typeof usn !== 'string' || usn.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid USN provided' });
    }

    if (typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email address provided' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    next();
};

const validateLogin = (req, res, next) => {
    const { usn, password } = req.body;

    if (!usn || !password) {
        return res.status(400).json({ error: 'USN and password are required' });
    }

    next();
};

const validateOtpSend = (req, res, next) => {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email is required' });
    }

    next();
};

const validateOtpVerify = (req, res, next) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    next();
};

const validatePasswordChange = (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    next();
};

module.exports = {
    validateRegister,
    validateLogin,
    validateOtpSend,
    validateOtpVerify,
    validatePasswordChange
};

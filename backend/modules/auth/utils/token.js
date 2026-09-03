const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_ask_ur_senior';

const signAccessToken = (student) => {
    const branchName = student.branch && student.branch.shortName ? student.branch.shortName : (typeof student.branch === 'string' ? student.branch : 'CS');
    const uId = student._id ? student._id.toString() : (student.id ? student.id.toString() : '');
    return jwt.sign(
        {
            userId: uId,
            branch: branchName,
            currentBranch: branchName,
            isAdmin: student.role === 'admin'
        },
        JWT_SECRET,
        { expiresIn: '30d' }
    );
};

const signRefreshToken = (student) => {
    return jwt.sign(
        {
            userId: student._id,
            type: 'refresh'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

const signRegistrationToken = (email, details = {}) => {
    return jwt.sign(
        {
            email: email.toLowerCase().trim(),
            name: details.name || '',
            googleId: details.googleId || '',
            profilePicture: details.profilePicture || '',
            type: 'registration'
        },
        JWT_SECRET,
        { expiresIn: '10m' }
    );
};

const signRecoveryToken = (email) => {
    return jwt.sign(
        {
            email: email.toLowerCase().trim(),
            type: 'recovery'
        },
        JWT_SECRET,
        { expiresIn: '10m' }
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        throw new Error(err.message === 'jwt expired' ? 'Token has expired' : 'Invalid token');
    }
};

module.exports = {
    signAccessToken,
    signRefreshToken,
    signRegistrationToken,
    signRecoveryToken,
    verifyToken
};

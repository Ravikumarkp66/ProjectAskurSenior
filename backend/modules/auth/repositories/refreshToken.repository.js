const RefreshToken = require('../../../models/RefreshToken');

class RefreshTokenRepository {
    async create({ userId, userModel = 'StudentAccount', token, expiresAt }) {
        const record = new RefreshToken({ userId, userModel, token, expiresAt });
        return record.save();
    }

    async findByToken(token) {
        if (!token) return null;
        return RefreshToken.findOne({ token, revoked: false });
    }

    async revokeToken(token) {
        if (!token) return null;
        return RefreshToken.findOneAndUpdate({ token }, { revoked: true }, { new: true });
    }

    async revokeAllForUser(userId, userModel = 'StudentAccount') {
        if (!userId) return null;
        return RefreshToken.updateMany({ userId, userModel }, { revoked: true });
    }
}

module.exports = new RefreshTokenRepository();

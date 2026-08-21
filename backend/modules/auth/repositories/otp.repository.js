const OTP = require('../../../models/OTP');

class OtpRepository {
    async create(email, otp, expiresAt) {
        const record = new OTP({ email: email.toLowerCase().trim(), otp, expiresAt });
        return record.save();
    }

    async findValidOtp(email, otp) {
        if (!email || !otp) return null;
        const cleanEmail = String(email).toLowerCase().trim();
        const cleanOtp = String(otp).trim();
        return OTP.findOne({
            email: cleanEmail,
            otp: cleanOtp,
            expiresAt: { $gt: new Date() }
        });
    }

    async deleteOtp(email) {
        if (!email) return null;
        return OTP.deleteMany({ email: email.toLowerCase().trim() });
    }
}

module.exports = new OtpRepository();

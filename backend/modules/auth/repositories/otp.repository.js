const bcrypt = require('bcryptjs');
const OTP = require('../../../models/OTP');

class OtpRepository {
    async create(email, plainOtp, expiresAt) {
        const cleanEmail = String(email).toLowerCase().trim();
        const cleanOtp = String(plainOtp).trim();
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(cleanOtp, salt);

        // Delete any existing OTP for this email / key first
        await OTP.deleteMany({ email: cleanEmail });

        const record = new OTP({
            email: cleanEmail,
            otp: hashedOtp,
            attempts: 0,
            expiresAt: expiresAt || new Date(Date.now() + 10 * 60 * 1000)
        });
        return record.save();
    }

    async findValidOtp(email, plainOtp) {
        if (!email || !plainOtp) return null;
        const cleanEmail = String(email).toLowerCase().trim();
        const cleanOtp = String(plainOtp).trim();

        const record = await OTP.findOne({
            email: cleanEmail,
            expiresAt: { $gt: new Date() }
        });

        if (!record) return null;

        if (record.attempts >= 3) {
            await OTP.deleteMany({ email: cleanEmail });
            return null;
        }

        // Compare using bcrypt
        let isMatch = false;
        try {
            // Check if stored as bcrypt hash ($2a$ or $2b$) or legacy plain
            if (record.otp.startsWith('$2')) {
                isMatch = await bcrypt.compare(cleanOtp, record.otp);
            } else {
                isMatch = (record.otp === cleanOtp);
            }
        } catch (err) {
            isMatch = false;
        }

        if (isMatch) {
            return record;
        } else {
            record.attempts = (record.attempts || 0) + 1;
            if (record.attempts >= 3) {
                await OTP.deleteMany({ email: cleanEmail });
            } else {
                await record.save();
            }
            return null;
        }
    }

    async deleteOtp(email) {
        if (!email) return null;
        return OTP.deleteMany({ email: String(email).toLowerCase().trim() });
    }
}

module.exports = new OtpRepository();

const User = require('../models/User');
const LoginSession = require('../models/LoginSession');
const Subscription = require('../models/Subscription');
const PaymentTransaction = require('../models/PaymentTransaction');
const bcrypt = require('bcryptjs');

/**
 * GET /api/account/summary
 * Provides account metadata, subscription/plan validity, and purchase history.
 */
const getAccountSummary = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select('-password -otp -otpExpires');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check subscription
        const activeSub = await Subscription.findOne({
            userId,
            status: 'ACTIVE',
            endDate: { $gte: new Date() }
        }).sort({ endDate: -1 });

        const isPlus = Boolean(activeSub || user.isAdmin || user.isTestUser);

        const plan = {
            name: isPlus ? 'AskUrSenior Plus' : 'Free Plan',
            code: isPlus ? (activeSub?.planCode || 'PLUS') : 'FREE',
            status: 'Active',
            validUntil: activeSub?.endDate ? activeSub.endDate.toISOString() : (user.isAdmin ? 'Lifetime (Admin)' : null),
            purchaseDate: activeSub?.startDate ? activeSub.startDate.toISOString() : null,
            amountPaid: activeSub?.amountPaid || (isPlus ? 199 : 0),
        };

        // Purchase history
        const transactions = await PaymentTransaction.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        const purchaseHistory = transactions.map(t => ({
            id: t._id,
            transactionId: t.transactionId,
            date: t.createdAt,
            product: t.planCode === 'PLUS' ? 'AskUrSenior Plus' : (t.planCode || 'AskUrSenior Plan'),
            amount: t.amount,
            currency: t.currency || 'INR',
            status: t.status === 'SUCCESS' ? 'Paid' : t.status,
            gateway: t.paymentGateway || 'Razorpay'
        }));

        // If no payment transactions but user has active subscription, show a fallback entry
        if (purchaseHistory.length === 0 && activeSub) {
            purchaseHistory.push({
                id: activeSub._id,
                transactionId: activeSub.paymentTransactionId || 'SUB-' + String(activeSub._id).slice(-6).toUpperCase(),
                date: activeSub.startDate || activeSub.createdAt,
                product: 'AskUrSenior Plus',
                amount: activeSub.amountPaid || 199,
                currency: 'INR',
                status: 'Paid',
                gateway: 'Online'
            });
        }

        return res.json({
            account: {
                name: user.name || 'Student',
                email: user.email,
                studentId: user.usn || 'Not Provided',
                college: user.collegeName || 'Engineering College',
                branch: user.currentBranch || user.branch || 'CS',
                createdAt: user.createdAt,
                status: user.isSuspended ? 'Suspended' : 'Active',
                authProvider: user.googleId ? 'Google' : 'Email & Password'
            },
            plan,
            purchaseHistory
        });
    } catch (error) {
        console.error('getAccountSummary error:', error);
        return res.status(500).json({ error: error.message || 'Failed to fetch account summary' });
    }
};

/**
 * GET /api/account/sessions
 * Returns recent login history & active sessions for this user.
 */
const getAccountSessions = async (req, res) => {
    try {
        const userId = req.userId;
        const sessions = await LoginSession.find({ userId })
            .sort({ loginTime: -1, createdAt: -1 })
            .limit(20)
            .lean();

        // Mark the current session
        let foundCurrent = false;

        const formattedSessions = sessions.map((s, idx) => {
            const isLatestActive = !foundCurrent && s.status === 'ACTIVE';
            if (isLatestActive) {
                foundCurrent = true;
            }

            return {
                id: s._id,
                sessionId: s.sessionId,
                deviceType: s.deviceType || 'Desktop',
                browser: s.browser || 'Browser',
                operatingSystem: s.operatingSystem || 'Unknown OS',
                ipAddress: s.ipAddress,
                location: s.location?.city && s.location?.city !== 'Unknown'
                    ? `${s.location.city}, ${s.location.country}`
                    : (s.location?.country !== 'Unknown' ? s.location?.country : 'Approx. Location'),
                loginTime: s.loginTime || s.createdAt,
                status: s.status,
                isCurrent: isLatestActive || (idx === 0 && s.status === 'ACTIVE')
            };
        });

        // If no records in LoginSession yet (e.g. legacy user), provide a current session placeholder
        if (formattedSessions.length === 0) {
            const ua = req.headers['user-agent'] || '';
            const isMobile = /mobile/i.test(ua);
            let browser = 'Chrome';
            if (/firefox/i.test(ua)) browser = 'Firefox';
            else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
            else if (/edg/i.test(ua)) browser = 'Edge';

            let os = 'Windows';
            if (/mac/i.test(ua)) os = 'macOS';
            else if (/android/i.test(ua)) os = 'Android';
            else if (/linux/i.test(ua)) os = 'Linux';
            else if (/iphone|ipad/i.test(ua)) os = 'iOS';

            formattedSessions.push({
                id: 'current-session',
                sessionId: 'current',
                deviceType: isMobile ? 'Mobile' : 'Desktop',
                browser,
                operatingSystem: os,
                location: 'Current Location',
                loginTime: new Date(),
                status: 'ACTIVE',
                isCurrent: true
            });
        }

        const activeCount = formattedSessions.filter(s => s.status === 'ACTIVE').length;

        return res.json({
            sessions: formattedSessions,
            activeCount: Math.max(activeCount, 1)
        });
    } catch (error) {
        console.error('getAccountSessions error:', error);
        return res.status(500).json({ error: error.message || 'Failed to fetch sessions' });
    }
};

/**
 * POST /api/account/sessions/revoke-others
 * Revokes all active sessions for this user except current.
 */
const revokeOtherSessions = async (req, res) => {
    try {
        const userId = req.userId;
        
        // Find newest active session to keep
        const currentSession = await LoginSession.findOne({ userId, status: 'ACTIVE' }).sort({ loginTime: -1 });

        const query = {
            userId,
            status: 'ACTIVE'
        };

        if (currentSession) {
            query._id = { $ne: currentSession._id };
        }

        const result = await LoginSession.updateMany(query, {
            status: 'REVOKED',
            logoutTime: new Date(),
            logoutReason: 'Revoked from account security management'
        });

        return res.json({
            message: 'All other active sessions have been signed out.',
            revokedCount: result.modifiedCount || 0
        });
    } catch (error) {
        console.error('revokeOtherSessions error:', error);
        return res.status(500).json({ error: error.message || 'Failed to revoke sessions' });
    }
};

/**
 * POST /api/account/delete
 * Deliberate account deletion. Requires confirmation text 'DELETE' or user's email.
 */
const deleteAccount = async (req, res) => {
    try {
        const userId = req.userId;
        const { confirmation, password } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify confirmation string
        const normalizedConfirm = String(confirmation || '').trim().toUpperCase();
        const userEmail = String(user.email).trim().toUpperCase();

        if (normalizedConfirm !== 'DELETE' && normalizedConfirm !== userEmail) {
            return res.status(400).json({
                error: 'Please type DELETE or your email address to confirm account deletion.'
            });
        }

        // If user has a local password and passed password, verify it
        if (user.password && password) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Incorrect password' });
            }
        }

        // Revoke all sessions
        await LoginSession.updateMany({ userId }, {
            status: 'REVOKED',
            logoutTime: new Date(),
            logoutReason: 'Account deleted by student'
        });

        // Remove user document
        await User.findByIdAndDelete(userId);

        return res.json({
            message: 'Your account has been permanently deleted.'
        });
    } catch (error) {
        console.error('deleteAccount error:', error);
        return res.status(500).json({ error: error.message || 'Failed to delete account' });
    }
};

module.exports = {
    getAccountSummary,
    getAccountSessions,
    revokeOtherSessions,
    deleteAccount
};

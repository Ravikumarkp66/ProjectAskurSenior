const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const sendEmail = require('../utils/sendEmail');

// Admin emails loaded from environment — never hardcoded
const ADMIN_EMAILS = process.env.ADMIN_EMAIL
    ? process.env.ADMIN_EMAIL.split(',').map(e => e.trim().toLowerCase())
    : [];
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId, branch, currentBranch, isAdmin, expiresIn = '7d') => {
    return jwt.sign({ userId, branch, currentBranch, isAdmin: !!isAdmin }, process.env.JWT_SECRET, {
        expiresIn
    });
};

const registerUser = async (req, res) => {
    try {
        const { usn, email, password, branch } = req.body;

        // Validate required fields
        if (!usn || !email || !password || !branch) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const trimmedUSN = usn.trim();

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ usn: trimmedUSN.toUpperCase() }, { email: email.toLowerCase().trim() }] });
        if (existingUser) {
            if (existingUser.isSuspended) {
                return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
            }
            return res.status(400).json({ error: 'User already exists' });
        }

        // Check if email should be auto-admin
        const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());

        // Create new user
        const user = new User({
            usn: trimmedUSN.toUpperCase(),
            email: email.toLowerCase(),
            password,
            branch,
            currentBranch: branch,
            isAdmin: isAdminEmail
        });

        await user.save();

        // Trigger Welcome Email asynchronously
        const { sendWelcomeEmail } = require('../utils/emailService');
        sendWelcomeEmail(user.email, user.name || user.username || 'Student').catch(err => console.error('Error sending welcome email:', err));

        const token = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                usn: user.usn,
                email: user.email,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: !!user.isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { usn, password, branch } = req.body;

        // Validate required fields
        if (!usn || !password || !branch) {
            return res.status(400).json({ error: 'USN, password, and branch are required' });
        }

        // Find user by USN
        const trimmedUSN = usn.trim();
        const user = await User.findOne({ usn: trimmedUSN.toUpperCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.isSuspended) {
            return res.status(403).json({ error: 'Your account has been suspended. Contact AskUrSenior support.' });
        }

        if (user.registrationComplete === false) {
            user.registrationComplete = true;
            await user.save();
        }

        // Check password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update current branch if different
        if (user.currentBranch !== branch) {
            user.currentBranch = branch;
            await user.save();
        }

        const token = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin);

        user.lastLogin = new Date();
        user.lastActiveAt = new Date();
        await user.save();

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                usn: user.usn,
                email: user.email,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: !!user.isAdmin,
                registrationComplete: true,
                semesterTimeline: user.semesterTimeline
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateSemesterTimeline = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { collegeStart, cie1, cie2, lastWorkingDay, seeStart, seeEnd, nextSem } = req.body;
        
        user.semesterTimeline = {
            collegeStart: collegeStart ? new Date(collegeStart) : null,
            cie1: cie1 ? new Date(cie1) : null,
            cie2: cie2 ? new Date(cie2) : null,
            lastWorkingDay: lastWorkingDay ? new Date(lastWorkingDay) : null,
            seeStart: seeStart ? new Date(seeStart) : null,
            seeEnd: seeEnd ? new Date(seeEnd) : null,
            nextSem: nextSem ? new Date(nextSem) : null
        };

        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const getAllUsers = async (req, res) => {
    try {
        console.log('Getting all users for admin...');
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        console.log(`Found ${users.length} users`);
        res.json({
            users: users,
            total: users.length
        });
    } catch (error) {
        console.error('Error getting all users:', error);
        res.status(500).json({ error: error.message });
    }
};
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.isSuspended) {
            return res.status(403).json({ error: 'Your account has been suspended. Contact AskUrSenior support.' });
        }

        // Check password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Auto-promote admin emails if not already admin
        const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());
        if (isAdminEmail && !user.isAdmin) {
            user.isAdmin = true;
            await user.save();
        }

        // Check if user is admin
        if (!user.isAdmin) {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }

        const token = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin);

        user.lastLogin = new Date();
        user.lastActiveAt = new Date();
        await user.save();

        res.json({
            message: 'Admin login successful',
            token,
            user: {
                id: user._id,
                usn: user.usn,
                email: user.email,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: true,
                registrationComplete: true,
                semesterTimeline: user.semesterTimeline
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const switchBranch = async (req, res) => {
    try {
        const { newBranch } = req.body;

        if (!newBranch) {
            return res.status(400).json({ error: 'New branch is required' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update current branch
        user.currentBranch = newBranch;
        await user.save();

        const token = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin);

        res.json({
            message: 'Branch switched successfully',
            token,
            user: {
                id: user._id,
                usn: user.usn,
                email: user.email,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: !!user.isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Google token is required' });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error('GOOGLE_CLIENT_ID is not configured in environment variables');
            return res.status(500).json({ error: 'Google authentication is not configured on the server' });
        }

        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            payload = ticket.getPayload();
        } catch (err) {
            console.log('ID Token verification failed, trying Access Token fallback...');
            const axios = require('axios');
            const response = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            payload = {
                email: response.data.email,
                sub: response.data.sub,
                picture: response.data.picture,
                name: response.data.name
            };
        }

        const email = payload?.email;
        const googleId = payload?.sub;

        if (!email || !googleId) {
            return res.status(400).json({ error: 'Invalid Google token' });
        }

        let user = await User.findOne({ $or: [{ email: email.toLowerCase() }, { googleId }] });

        if (user && user.isSuspended) {
            return res.status(403).json({ error: 'Your account has been suspended. Contact AskUrSenior support.' });
        }

        if (!user) {
            const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());
            user = new User({
                email: email.toLowerCase(),
                name: payload?.name || '',
                profilePicture: payload?.picture || '',
                googleId,
                branch: 'CS',
                currentBranch: 'CS',
                isAdmin: isAdminEmail,
                registrationComplete: isAdminEmail // Only admins have complete registration by default
            });
        } else {
            if (!user.googleId) {
                user.googleId = googleId;
            }
            if (!user.name && payload?.name) {
                user.name = payload.name;
            }
            if (!user.profilePicture && payload?.picture) {
                user.profilePicture = payload.picture;
            }
            // Check if admin email and promote to admin if needed
            const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());
            if (isAdminEmail && !user.isAdmin) {
                user.isAdmin = true;
                user.registrationComplete = true; // Admins don't need to complete registration
            }
        }

        await user.save();

        const tokenJwt = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin, '30d');

        user.lastLogin = new Date();
        user.lastActiveAt = new Date();
        await user.save();

        res.json({
            message: 'Successfully logged in with Google',
            token: tokenJwt,
            user: {
                id: user._id,
                usn: user.usn,
                username: user.username,
                email: user.email,
                name: user.name,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: !!user.isAdmin,
                registrationComplete: user.registrationComplete
            },
            needsCompletion: !user.registrationComplete
        });
    } catch (error) {
        console.error('Google login failed - Full error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        // Provide more specific error messages
        if (error.message && error.message.includes('Token used too early')) {
            return res.status(400).json({ error: 'Invalid token timing. Please try again.' });
        }
        if (error.message && error.message.includes('Invalid token signature')) {
            return res.status(400).json({ error: 'Invalid token signature. Please try again.' });
        }

        res.status(500).json({
            error: 'Google login failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Complete Google registration - Add USN, Name, Username, and Branch for new Google/OTP users
const completeGoogleRegistration = async (req, res) => {
    try {
        const { usn, username, branch, name } = req.body;
        const userId = req.userId;

        if (!usn || !username || !branch || !name) {
            return res.status(400).json({ error: 'USN, Name, Username, and Branch are required' });
        }

        const trimmedUSN = usn.trim();
        const trimmedName = name.trim();

        if (trimmedName.length < 2) {
            return res.status(400).json({ error: 'Name must be at least 2 characters' });
        }

        // Validate USN format
        if (!/^[a-z0-9]{8,12}$/i.test(trimmedUSN)) {
            return res.status(400).json({ error: 'Invalid USN format' });
        }

        // Check if USN already exists
        const existingUsn = await User.findOne({ usn: trimmedUSN.toUpperCase() });
        if (existingUsn && existingUsn._id.toString() !== userId) {
            return res.status(400).json({ error: 'USN already registered' });
        }

        // Check if Username already exists
        const existingUsername = await User.findOne({ username: username.toLowerCase() });
        if (existingUsername && existingUsername._id.toString() !== userId) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.registrationComplete) {
            return res.status(400).json({ error: 'Registration already completed' });
        }

        // Update user with USN, Name, Username, Branch, and mark registration complete
        user.usn = trimmedUSN.toUpperCase();
        user.name = trimmedName;
        user.username = username.toLowerCase();
        user.branch = branch;
        user.currentBranch = branch;
        user.registrationComplete = true;

        await user.save();

        // Trigger Welcome Email asynchronously
        const { sendWelcomeEmail } = require('../utils/emailService');
        sendWelcomeEmail(user.email, user.name || user.username || 'Student').catch(err => console.error('Error sending welcome email:', err));

        // Generate new token with updated information
        const tokenJwt = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin);

        res.json({
            message: 'Profile completed successfully',
            token: tokenJwt,
            user: {
                id: user._id,
                usn: user.usn,
                username: user.username,
                email: user.email,
                name: user.name,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: !!user.isAdmin,
                registrationComplete: true
            }
        });
    } catch (error) {
        console.error('Complete profile error:', error.message);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ error: `${field} already exists` });
        }
        res.status(500).json({ error: 'Failed to complete profile' });
    }
};

const heartbeat = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.userId, { lastActiveAt: new Date() });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if user exists and is suspended
        const user = await User.findOne({ email: normalizedEmail });
        if (user && user.isSuspended) {
            return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

        // Delete any existing OTP records for this email
        await OTP.deleteMany({ email: normalizedEmail });

        // Create new OTP record
        await OTP.create({
            email: normalizedEmail,
            otp,
            expiresAt
        });

        // Parse User Agent for Platform/Browser
        const userAgent = req.headers['user-agent'] || 'Unknown';
        let platform = 'Unknown Device';
        let browser = 'Unknown Browser';

        if (userAgent.includes('Windows')) platform = 'Windows';
        else if (userAgent.includes('Macintosh')) platform = 'macOS';
        else if (userAgent.includes('iPhone')) platform = 'iPhone';
        else if (userAgent.includes('iPad')) platform = 'iPad';
        else if (userAgent.includes('Android')) platform = 'Android';
        else if (userAgent.includes('Linux')) platform = 'Linux';

        if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
        else if (userAgent.includes('Edge') || userAgent.includes('Edg')) browser = 'Edge';
        else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) browser = 'Internet Explorer';

        // Format Time in IST
        const timeString = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true,
            timeZone: 'Asia/Kolkata'
        }) + ' IST';

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verificationUrl = `${frontendUrl}/login?email=${encodeURIComponent(normalizedEmail)}&otp=${otp}`;

        // HTML Branded Email Template
        const emailHtml = `
<div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 420px; margin: 0 auto; padding: 40px 24px; background-color: #050505; color: #f8fafc; border: 1px solid #1e293b; border-radius: 24px; text-align: center; box-shadow: 0 20px 50px rgba(139, 92, 246, 0.15);">
  <!-- AS Logo Card -->
  <div style="margin-bottom: 16px; text-align: center;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; border-collapse: collapse;">
      <tr>
        <td style="background-color: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 16px; padding: 12px; text-align: center; vertical-align: middle;">
          <svg width="40" height="40" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
            <path d="M105 380L205 205C220 180 240 170 270 170H405" stroke="#ffffff" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M405 170H290C250 170 220 200 220 240C220 280 250 310 290 310H345" stroke="#8B5CF6" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M285 240H360C400 240 430 270 430 310C430 350 400 380 360 380H210" stroke="#8B5CF6" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </td>
      </tr>
    </table>
  </div>

  <!-- Brand Name -->
  <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; margin-bottom: 24px;">
    Ask<span style="color: #8B5CF6;">UR</span>Senior
  </div>

  <div style="height: 1px; background: linear-gradient(90deg, transparent, #1e293b, transparent); margin-bottom: 24px;"></div>

  <!-- Greeting -->
  <div style="text-align: left; padding: 0 8px; margin-bottom: 24px;">
    <p style="font-size: 16px; font-weight: 700; color: #ffffff; margin: 0 0 8px 0;">Hi there 👋</p>
    <p style="font-size: 14px; line-height: 1.5; color: #94a3b8; margin: 0;">Use the following code to verify your account.</p>
  </div>

  <!-- OTP Code -->
  <div style="font-size: 38px; font-weight: 800; letter-spacing: 2px; color: #8B5CF6; background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.2); padding: 14px 28px; border-radius: 16px; display: inline-block; margin: 8px 0 24px 0; font-family: monospace; -webkit-user-select: all; user-select: all; cursor: pointer;" title="Click to select all">
    ${otp.slice(0, 3)} ${otp.slice(3)}
  </div>

  <!-- Validity -->
  <div style="font-size: 13px; font-weight: 500; color: #64748b; margin-bottom: 8px;">
    Valid for 5 minutes.
  </div>

  <!-- Use Once -->
  <div style="font-size: 13px; font-weight: 500; color: #64748b; margin-bottom: 24px;">
    This verification code can only be used once.
  </div>

  <!-- Security Disclaimer -->
  <div style="text-align: left; background-color: rgba(30, 41, 59, 0.25); border: 1px solid rgba(255, 255, 255, 0.03); padding: 16px; border-radius: 14px; margin-bottom: 24px; font-size: 12px; line-height: 1.5; color: #64748b;">
    <p style="margin: 0 0 4px 0;">Never share this code with anyone.</p>
    <p style="margin: 0;">AskUrSenior will never ask for your OTP.</p>
  </div>

  <!-- Need Help -->
  <div style="text-align: center; border-top: 1px dashed #1e293b; padding-top: 20px; margin-bottom: 24px;">
    <p style="font-size: 13px; font-weight: 600; color: #94a3b8; margin: 0 0 4px 0;">Need help?</p>
    <a href="mailto:hello@askursenior.org" style="font-size: 13px; color: #8B5CF6; text-decoration: none; font-weight: 600;">hello@askursenior.org</a>
  </div>

  <!-- Footer -->
  <div style="font-size: 11px; color: #475569; line-height: 1.5; text-align: center;">
    <p style="margin: 0 0 4px 0; font-weight: 600; color: #64748b;">© 2026 AskUrSenior</p>
    <p style="margin: 0;">Helping engineering students navigate their journey.</p>
  </div>
</div>
        `;

        // Send Email using Resend
        try {
            await sendEmail({
                email: normalizedEmail,
                subject: 'Verify your AskUrSenior account',
                html: emailHtml
            });
        } catch (mailErr) {
            console.error('Failed to send email:', mailErr);
            // In dev fallback
            if (process.env.NODE_ENV !== 'production' || !process.env.RESEND_API_KEY) {
                console.log(`[DEV ONLY] OTP for ${normalizedEmail} is: ${otp}`);
            } else {
                return res.status(500).json({ error: 'Failed to send verification email. Please try again later.' });
            }
        }

        res.json({ success: true, message: 'Verification code sent to your email.' });
    } catch (error) {
        console.error('sendOtp error:', error);
        res.status(500).json({ error: error.message });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Verify record in OTP collection
        const record = await OTP.findOne({
            email: normalizedEmail,
            otp
        });

        if (!record) {
            return res.status(400).json({ error: 'Invalid or expired verification code' });
        }

        // OTP is valid! Delete all OTP records for this email
        await OTP.deleteMany({ email: normalizedEmail });

        // Find or create the User
        let user = await User.findOne({ email: normalizedEmail });
        if (user) {
            if (user.isSuspended) {
                return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
            }
            user.lastLogin = new Date();
            user.lastActiveAt = new Date();
            await user.save();
        } else {
            // New user registration flow
            const isAdminEmail = ADMIN_EMAILS.includes(normalizedEmail);
            user = new User({
                email: normalizedEmail,
                branch: 'CS',
                currentBranch: 'CS',
                isAdmin: isAdminEmail,
                registrationComplete: false
            });
            await user.save();
        }

        // Generate 7-day session token for OTP Login
        const token = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin, '7d');

        res.json({
            success: true,
            message: 'Verification successful',
            token,
            user: {
                id: user._id,
                usn: user.usn,
                email: user.email,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: !!user.isAdmin,
                registrationComplete: user.registrationComplete
            },
            needsCompletion: !user.registrationComplete
        });
    } catch (error) {
        console.error('verifyOtp error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    adminLogin,
    getUserProfile,
    getAllUsers,
    switchBranch,
    googleLogin,
    completeGoogleRegistration,
    discordCallback,
    heartbeat,
    ADMIN_EMAILS,
    sendOtp,
    verifyOtp,
    updateSemesterTimeline
};

async function discordCallback(req, res) {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: 'OAuth code is required' });
    }

    try {
        const { gaxios } = require('gaxios');
        const qs = require('qs');

        // 1. Exchange code for access token
        const tokenResponse = await gaxios.request({
            method: 'POST',
            url: 'https://discord.com/api/oauth2/token',
            data: qs.stringify({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/discord/callback`,
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token } = tokenResponse.data;

        // 2. Fetch user information from Discord
        const userResponse = await gaxios.request({
            url: 'https://discord.com/api/users/@me',
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const discordUser = userResponse.data;
        // discordUser: { id, username, email, avatar, etc }

        // 3. Find or create user in your database
        let user = await User.findOne({
            $or: [
                { discordId: discordUser.id },
                { email: discordUser.email?.toLowerCase() }
            ]
        });

        if (!user) {
            // New user registration flow
            const isAdminEmail = ADMIN_EMAILS.includes(discordUser.email?.toLowerCase());
            user = new User({
                discordId: discordUser.id,
                email: discordUser.email?.toLowerCase(),
                name: discordUser.global_name || discordUser.username,
                profilePicture: discordUser.avatar
                    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
                    : '',
                branch: 'CS',
                currentBranch: 'CS',
                isAdmin: isAdminEmail,
                registrationComplete: isAdminEmail
            });
        } else {
            // Update existing user
            if (!user.discordId) user.discordId = discordUser.id;
            if (!user.name && (discordUser.global_name || discordUser.username)) {
                user.name = discordUser.global_name || discordUser.username;
            }
        }

        await user.save();

        const tokenJwt = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin);

        // 4. Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const redirectUrl = new URL(`${frontendUrl}/login-success`);
        redirectUrl.searchParams.append('token', tokenJwt);
        redirectUrl.searchParams.append('needsCompletion', (!user.registrationComplete).toString());

        res.redirect(redirectUrl.toString());

    } catch (error) {
        console.error('Discord callback error:', error.response?.data || error.message);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/login-error?error=discord_auth_failed`);
    }
}

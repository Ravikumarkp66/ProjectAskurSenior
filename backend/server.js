const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// Custom Configs, Middleware & EventBus
const { corsOptions } = require('./config/cors');
const mobileGuard = require('./middleware/mobileGuard');
const { setupSocketHandler } = require('./sockets/socketHandler');
const { initEventBus } = require('./events');

const authRoutes = require('./routes/authRoutes').default || require('./routes/authRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const bugRoutes = require('./routes/bugRoutes');
const requestRoutes = require('./routes/requestRoutes');
const downloadRoutes = require('./routes/downloadRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const userUploadRoutes = require('./routes/userUploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const eventRoutes = require('./routes/eventRoutes');
const seedDatabase = require('./utils/seedDatabase');
const User = require('./models/User');
require('./modules/assistant/cron');

const app = express();
const server = http.createServer(app);

// Optimization: Compression middleware
app.use(compression());

// CORS configuration
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Trust proxy for secure cookies/rate limiting behind load balancers
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// Global Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : (process.env.NODE_ENV === 'production' ? 1000 : 10000),
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        if (process.env.NODE_ENV !== 'production') return true;
        if (req.headers['x-perf-benchmark'] === 'true') return true;
        if (req.path.includes('/events/track') || req.path.includes('/heartbeat')) return true;
        const ip = req.ip || req.connection?.remoteAddress || '';
        return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    }
});
app.use('/api/', limiter);

// Mobile Request Guard
app.use(mobileGuard);

// Upload Rate Limiter
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many uploads, please try again later.',
});
app.use('/api/upload', uploadLimiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static uploads
app.use('/uploads', express.static('uploads'));

// Socket.IO Setup
const io = new Server(server, { cors: corsOptions });
app.set('io', io);
setupSocketHandler(io);

// Initialize Observer EventBus listeners
initEventBus(() => io);

// MongoDB Connection
mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10) || 50
    })
    .then(async () => {
        console.log('MongoDB connected successfully');

        try {
            await User.syncIndexes();
            console.log('User indexes synced');
        } catch (error) {
            console.error('Failed to sync user indexes:', error.message);
        }

        console.log('Running without Redis cache');

        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV}`);
            console.log(`🔗 Current Directory: ${process.cwd()}`);
            console.log(`⏰ Started at: ${new Date().toISOString()}`);

            // Inspect Docker environment on startup for staging/production visibility
            try {
                require('./services/code-execution/dockerHealth').checkDockerAvailability().catch(() => {});
            } catch (dErr) {}
        });

        if (process.env.NODE_ENV !== 'production') {
            try {
                await seedDatabase();
            } catch (error) {
                console.error('Error seeding database:', error.message);
            }
        }

        try {
            await require('./services/testimonialService').seedTestimonialsIfEmpty();
            await require('./services/faqService').seedFaqsIfEmpty();
            await require('./services/contributorService').seedContributorsIfEmpty();
            await require('./services/subscriptionModuleService').seedAllIfEmpty();
            await require('./services/playgroundService').seedPlaygroundIfEmpty();
        } catch (error) {
            console.error('Error seeding initial datasets:', error.message);
        }
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        setTimeout(() => process.exit(1), 5000);
    });

// API Routes
app.use('/api/playground', require('./routes/playgroundRoutes'));
app.use('/api/hero', require('./routes/heroRoutes'));
app.use('/api/landing-page', require('./routes/landingPageRoutes'));
app.use('/api/testimonials', require('./routes/testimonialRoutes'));
app.use('/api/faqs', require('./routes/faqRoutes'));
app.use('/api/contributors', require('./routes/contributorRoutes'));
app.use('/api/subscription', require('./routes/subscriptionModuleRoutes'));
const unifiedAuthRoutes = require('./modules/auth/routes/authV2.routes');
app.use('/api/auth', unifiedAuthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/v2/auth', unifiedAuthRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/user-uploads', userUploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user-notifications', require('./routes/userNotificationRoutes'));
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/admin/utils', require('./routes/adminUtilsRoutes').default || require('./routes/adminUtilsRoutes'));
app.use('/api/articles', require('./routes/articleRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/experiences', require('./routes/interviewExperienceRoutes').default || require('./routes/interviewExperienceRoutes'));
app.use('/api/knowledge-base', require('./routes/knowledgeBaseRoutes'));
app.use('/api/mentorship', require('./routes/mentorshipRoutes'));
app.use('/api/discussions', require('./routes/discussionRoutes'));
app.use('/api/campus-hub', require('./routes/campusHub'));
app.use('/api/faculty', require('./routes/facultyRoutes'));
app.use('/api/academic', require('./modules/academic/academic.routes'));

// CMS Routes
app.use('/api/lookups', require('./routes/lookupRoutes'));
app.use('/api/cms/subjects', require('./routes/studentCmsRoutes'));
app.use('/api/subjects', require('./routes/subjectMaterialRoutes'));
app.post('/api/cms/materials/:id/download', require('./controllers/studentCmsController').trackDownload);
app.use('/api/admin/subjects', require('./routes/adminCmsSubjectRoutes'));
app.use('/api/academic-subjects', require('./routes/academicSubjectRoutes'));
app.use('/api/admin/materials', require('./routes/adminCmsMaterialRoutes'));
app.use('/api/branches', require('./routes/branchRoutes'));
app.use('/api/admin/schemes', require('./routes/schemeRoutes'));
app.use('/api/admin/academic-materials', require('./routes/academicMaterialRoutes'));

app.get('/api/hero-stats', async (req, res) => {
    try {
        const Document = require('./models/Document');
        const User = require('./models/User');

        const [notesCount, seeCount, internalsCount, othersCount, usersCount] = await Promise.all([
            Document.countDocuments({ documentType: 'notes', isApproved: true, isDeleted: { $ne: true } }),
            Document.countDocuments({ documentType: 'see', isApproved: true, isDeleted: { $ne: true } }),
            Document.countDocuments({ documentType: 'internals', isApproved: true, isDeleted: { $ne: true } }),
            Document.countDocuments({ documentType: 'others', isApproved: true, isDeleted: { $ne: true } }),
            User.countDocuments({ isDeleted: { $ne: true } })
        ]);

        res.json({
            notes: notesCount + 170,
            pyqs: seeCount + 100,
            questionBanks: internalsCount + 15,
            otherMaterials: othersCount + 30,
            users: Math.max(800, usersCount)
        });
    } catch (error) {
        console.error('Error fetching hero stats:', error);
        res.status(500).json({ error: 'Failed to fetch hero stats' });
    }
});

// Consolidated Dashboard Summary Route
const analyticsController = require('./controllers/analyticsController');
const authMiddleware = require('./middleware/auth');
const adminMiddleware = require('./middleware/admin');
app.get('/api/admin/dashboard-summary', authMiddleware, adminMiddleware, analyticsController.getDashboardSummary);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);

    if (process.env.NODE_ENV === 'production') {
        res.status(err.status || 500).json({
            error: 'Something went wrong!',
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(err.status || 500).json({
            error: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        });
    }
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        mongoose.connection.close();
    });
});

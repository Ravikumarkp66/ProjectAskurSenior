const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const bugRoutes = require('./routes/bugRoutes');
const downloadRoutes = require('./routes/downloadRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const userUploadRoutes = require('./routes/userUploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const seedDatabase = require('./utils/seedDatabase');

const app = express();

// Trust proxy for secure cookies/rate limiting behind load balancers (Vercel/Render)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false // Disabled for PDF viewing
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// Stricter rate limiting for uploads
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes  
    max: 20, // Only 20 uploads per 15 minutes
    message: 'Too many uploads, please try again later.',
});
app.use('/api/upload', uploadLimiter);

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// CORS: allow only configured frontend origin in production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? [
            process.env.FRONTEND_URL,
            'https://askursenior.vercel.app',
            'https://project-askur-senior.vercel.app'
        ].filter(Boolean)
        : true,
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// MongoDB Connection
mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(async () => {
        console.log('MongoDB connected successfully');

        // Redis is disabled - continuing without cache
        console.log('Running without Redis cache');

        // Seed database only in development
        if (process.env.NODE_ENV !== 'production') {
            try {
                await seedDatabase();
            } catch (error) {
                console.error('Error seeding database:', error.message);
            }
        }
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/user-uploads', userUploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);

    // Don't leak error details in production
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

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        mongoose.connection.close();
    });
});

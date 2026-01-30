const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const progressRoutes = require('./routes/progressRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const bugRoutes = require('./routes/bugRoutes');
const seedDatabase = require('./utils/seedDatabase');
const { connectRedis } = require('./utils/redisClient');

const app = express();

// Middleware
// CORS: allow only configured frontend origin in production. In development allow all for convenience.
const corsOptions =
    process.env.NODE_ENV === 'production'
        ? { origin: process.env.FRONTEND_URL } // set FRONTEND_URL in Render / production env
        : undefined;
app.use(cors(corsOptions));
app.use(express.json());

// MongoDB Connection
mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(async () => {
        console.log('MongoDB connected successfully');

        // Connect to Redis
        await connectRedis();

        // Seed database on startup only in non-production environments
        if (process.env.NODE_ENV !== 'production') {
            seedDatabase().catch((error) => {
                console.error('Error seeding database:', error);
            });
        }
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/bugs', bugRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

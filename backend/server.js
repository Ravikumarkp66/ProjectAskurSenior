const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

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
const seedDatabase = require('./utils/seedDatabase');
const User = require('./models/User');
const { sendWhatsAppMessage } = require('./modules/whatsapp/whatsapp.service');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const UserNotification = require('./models/UserNotification');
require('./modules/assistant/cron');

const app = express();
const server = http.createServer(app);

// Data structures for tracking real-time users
const activeUsers = new Map();
const activeSockets = new Set();

// Optimization: Compression middleware
app.use(compression());

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// CORS: allow only configured frontend origin in production
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'https://askursenior.vercel.app',
            'https://project-askur-senior.vercel.app',
            'https://askursenior.onrender.com'
        ].filter(Boolean);
        
        // Allow requests with no origin (like mobile apps) or if in development
        if (!origin || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.error('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Socket.IO Setup
const io = new Server(server, { cors: corsOptions });
app.set('io', io);

// Admin verification middleware for socket could be added here, 
// for now we rely on the 'join_admin' event

io.on('connection', (socket) => {
    activeSockets.add(socket.id);
    console.log("Socket connected:", socket.id);
    
    socket.on('user_online', (userData) => {
        console.log("USER ONLINE:", userData);
        const { userId, name, email, role } = userData;
        if (!userId) return;

        if (!activeUsers.has(userId)) {
            activeUsers.set(userId, {
                userId,
                name,
                email,
                role,
                sockets: new Set(),
                joinedAt: new Date()
            });
        }
        
        activeUsers.get(userId).sockets.add(socket.id);

        io.emit("dashboard_live_stats", {
            liveUsers: activeUsers.size,
            trafficTabs: activeSockets.size
        });

        io.emit(
            "live_users_list",
            Array.from(activeUsers.values()).map(user => ({
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                tabs: user.sockets.size,
                joinedAt: user.joinedAt
            }))
        );
    });

    socket.on('join_admin', () => {
        socket.join('admins');
        Conversation.find({})
            .sort({ updatedAt: -1 })
            .then(conversations => {
                socket.emit('admin_conversations_list', conversations);
            })
            .catch(err => console.error(err));
    });

    socket.on('create_or_join_conversation', async (userData) => {
        try {
            const { userId, name, email } = userData;
            if (!userId) return;

            let conversation = await Conversation.findOne({ userId });

            if (!conversation) {
                conversation = await Conversation.create({
                    userId,
                    userName: name,
                    userEmail: email
                });
                io.to('admins').emit('new_conversation', conversation);
            }

            const roomId = `conversation_${conversation._id}`;
            socket.join(roomId);

            const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
            
            conversation.unreadUserCount = 0;
            await conversation.save();

            socket.emit('conversation_data', { conversation, messages });
        } catch (error) {
            console.error('Socket create_or_join_conversation error:', error);
        }
    });

    socket.on('send_message', async (data) => {
        try {
            const { conversationId, senderId, senderType, message } = data;
            
            const newMessage = await Message.create({
                conversationId,
                senderId,
                senderType,
                message
            });

            const conversation = await Conversation.findById(conversationId);
            if (conversation) {
                conversation.lastMessage = message;
                if (senderType === 'user') {
                    conversation.unreadAdminCount += 1;
                } else if (senderType === 'admin') {
                    conversation.unreadUserCount += 1;
                    
                    // Create Notification for the user
                    const newNotif = await UserNotification.create({
                        userId: conversation.userId,
                        type: 'admin_reply',
                        title: 'New Support Reply',
                        message: 'You have received a new reply from ASK+ Support.'
                    });

                    // Emit event for notification
                    const userKey = conversation.userId.toString();
                    if (activeUsers.has(userKey)) {
                        const userSocketData = activeUsers.get(userKey);
                        userSocketData.sockets.forEach(socketId => {
                            io.to(socketId).emit('notification_created', newNotif);
                            io.to(socketId).emit('admin_message_sent', { conversationId });
                        });
                    }
                }
                await conversation.save();
            }

            const roomId = `conversation_${conversationId}`;
            io.to(roomId).emit('receive_message', newMessage);
            io.to('admins').emit('conversation_updated', conversation);
        } catch (error) {
            console.error('Socket send_message error:', error);
        }
    });

    socket.on('delete_message', async (data) => {
        try {
            const { messageId, conversationId } = data;
            await Message.findByIdAndUpdate(messageId, { isDeletedForUser: true });
            
            const roomId = `conversation_${conversationId}`;
            io.to(roomId).emit('message_deleted', messageId);
        } catch (error) {
            console.error('Socket delete_message error:', error);
        }
    });

    socket.on('typing', (data) => {
        const { conversationId, senderType, isTyping } = data;
        const roomId = `conversation_${conversationId}`;
        socket.to(roomId).emit('typing_status', { senderType, isTyping });
    });

    socket.on('mark_seen', async (data) => {
        try {
            const { conversationId, readerType } = data;
            const targetSender = readerType === 'admin' ? 'user' : 'admin';
            
            await Message.updateMany(
                { conversationId, senderType: targetSender, seen: false },
                { seen: true }
            );
            
            const roomId = `conversation_${conversationId}`;
            io.to(roomId).emit('messages_seen', { readerType, conversationId });
        } catch (error) {
            console.error('Socket mark_seen error:', error);
        }
    });

    socket.on('admin_join_conversation', (conversationId) => {
        const roomId = `conversation_${conversationId}`;
        socket.join(roomId);
        
        // Notify user that admin has joined
        socket.to(roomId).emit('admin_joined', conversationId);

        Conversation.findByIdAndUpdate(conversationId, { unreadAdminCount: 0 }, { new: true })
            .then(conv => {
                if(conv) io.to('admins').emit('conversation_updated', conv);
            }).catch(err => console.error(err));
    });

    socket.on('disconnect', () => {
        console.log("Socket disconnected:", socket.id);
        activeSockets.delete(socket.id);
        
        for (const [userId, user] of activeUsers.entries()) {
            user.sockets.delete(socket.id);
            if (user.sockets.size === 0) {
                activeUsers.delete(userId);
            }
        }

        io.emit("dashboard_live_stats", {
            liveUsers: activeUsers.size,
            trafficTabs: activeSockets.size
        });

        io.emit(
            "live_users_list",
            Array.from(activeUsers.values()).map(user => ({
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                tabs: user.sockets.size,
                joinedAt: user.joinedAt
            }))
        );
    });
});


// MongoDB Connection
mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000, // 10s selection timeout
        socketTimeoutMS: 45000,         // 45s socket timeout
        maxPoolSize: 10                 // Limit connections
    })

    .then(async () => {
        console.log('MongoDB connected successfully');

        try {
            await User.syncIndexes();
            console.log('User indexes synced');
        } catch (error) {
            console.error('Failed to sync user indexes:', error.message);
        }

        // Redis is disabled - continuing without cache
        console.log('Running without Redis cache');

        // Start server only after DB connection
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV}`);
            console.log(`🔗 Current Directory: ${process.cwd()}`);
            console.log(`⏰ Started at: ${new Date().toISOString()}`);
        });

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
        // On Render, we want to let it retry or fail fast
        setTimeout(() => process.exit(1), 5000);
    });

// Routes
app.use('/api/auth', authRoutes);
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
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/discord', require('./routes/discord'));
// Admin utility routes
app.use('/api/admin/utils', require('./routes/adminUtilsRoutes').default || require('./routes/adminUtilsRoutes'));
app.use('/api/articles', require('./routes/articleRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/experiences', require('./routes/interviewExperienceRoutes').default || require('./routes/interviewExperienceRoutes'));
app.use('/api/knowledge-base', require('./routes/knowledgeBaseRoutes'));
app.use('/api/mentorship', require('./routes/mentorshipRoutes'));
app.use('/api/academic', require('./modules/academic/academic.routes'));
app.use('/api/whatsapp', require('./modules/whatsapp/whatsapp.routes'));
app.use('/api/whatsapp', require('./routes/whatsappRoutes')); // Meta Cloud API
const { sendWhatsAppMessage: sendMetaWhatsAppMessage, sendWhatsAppTemplate } = require('./services/whatsappService');
app.get("/test", async (req, res) => {
  try {
    await sendWhatsAppTemplate("919986577493", "Present", "DBMS 10 AM", "Submit assignment");
    res.send("Template Sent successfully!");
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    res.status(400).json({
      error: "WhatsApp API Error",
      details: errorDetails
    });
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

// Quick WhatsApp Test Route
app.get('/test-whatsapp', async (req, res) => {
    try {
        const testPhone = req.query.phone || "+919986577493"; 

        if (testPhone.includes('X')) {
            return res.status(400).send("❌ Error: Please provide a real phone number in the URL (e.g., ?phone=+919986577493)");
        }

        console.log(`Attempting to send WhatsApp test to: ${testPhone}`);
        
        const result = await sendWhatsAppMessage(testPhone, "🔥 FINAL WORKING MESSAGE");
        
        if (result.success) {
            res.send(`✅ Success! Message sent to ${testPhone}. SID: ${result.sid}`);
        } else {
            res.status(500).send(`❌ Failed: ${result.error}`);
        }
    } catch (err) {
        console.error("WhatsApp Test Route Error:", err);
        res.status(500).send("❌ Twilio Error: " + err.message);
    }
});

// Manual Daily Message Test Route
app.get('/api/whatsapp/test-daily', async (req, res) => {
    try {
        const { getDashboardData } = require('./modules/assistant/getDashboardData');
        const { generateDailyMessage } = require('./modules/assistant/messageGenerator');
        
        // Find the first user who has a phone number set
        const user = await User.findOne({ phoneNumber: { $ne: null } });
        
        if (!user) {
            return res.status(404).send("❌ No user found with a phone number set. Please update a user in DB first.");
        }

        const data = await getDashboardData(user._id);
        const message = generateDailyMessage(data);

        await sendWhatsAppMessage(user.phoneNumber, message);
        res.send(`✅ Daily message test sent to ${user.phoneNumber} for user ${user.email}`);
    } catch (err) {
        console.error("Manual Daily Test Error:", err);
        res.status(500).send("❌ Error: " + err.message);
    }
});

// Quick route to activate WhatsApp for testing (No auth for browser ease)
app.get('/api/whatsapp/activate-me', async (req, res) => {
    try {
        const phone = req.query.phone || "+919986577493";
        // Just find the first user for testing purposes
        const user = await User.findOne();
        if (!user) return res.status(404).send("No users found in DB");
        
        user.phoneNumber = phone;
        user.whatsappEnabled = true;
        await user.save();
        res.send(`✅ WhatsApp activated for ${user.email} with number ${phone}`);
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
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



// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        mongoose.connection.close();
    });
});

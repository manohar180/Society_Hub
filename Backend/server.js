const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http'); // Import HTTP module
const { Server } = require('socket.io'); // Import Socket.io

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));
app.use(express.json());

// --- SOCKET.IO SETUP ---
const server = http.createServer(app); // Wrap app in HTTP server
const io = new Server(server, {
    cors: {
        origin: "*", // Allow access from mobile/laptop
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Check for connection
io.on('connection', (socket) => {
    console.log('User Connected: ' + socket.id);
    socket.on('disconnect', () => {
        console.log('User Disconnected');
    });
});

// Make 'io' accessible to our Routes
app.use((req, res, next) => {
    req.io = io;
    next();
});
// -----------------------

// Import Routes
const authRoutes = require('./routes/auth');
const visitorRoutes = require('./routes/visitors');
const invoiceRoutes = require('./routes/invoices');
const adminRoutes = require('./routes/admin');
const communityRoutes = require('./routes/community'); 

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/community', communityRoutes); 

app.get('/', (req, res) => res.send('SocietyHub API is running...'));

// --- GLOBAL ERROR HANDLER (for multer & other errors) ---
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    
    // Multer/Cloudinary file upload errors
    if (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File upload error: ' + err.message });
    }
    
    // Cloudinary errors
    if (err.message && err.message.includes('Cloudinary')) {
        return res.status(500).json({ message: 'Image upload failed: ' + err.message });
    }
    
    // Generic error
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;

// CHANGE: Listen using 'server' instead of 'app'
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
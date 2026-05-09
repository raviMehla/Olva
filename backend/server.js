require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Import Routes
const authRoutes = require('./routes/auth');
const groqRoutes = require('./routes/groq');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Apply Routes
app.use('/auth', authRoutes); // All auth routes will start with /auth
app.use('/api', groqRoutes);   // All Groq API routes will start with /api

// Health Check Route
app.get('/', (req, res) => {
    res.send(`
        <h1>Olva Backend is Running!</h1>
        <a href="/auth/google">Click here to test Google Login</a>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is awake and listening on http://localhost:${PORT}`);
});
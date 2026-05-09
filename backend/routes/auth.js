const express = require('express');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Initialize the Google OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/auth/google/callback'
);

// Global in-memory store for Drive refresh tokens (for Day 1 & 2 testing)
global.userTokens = {};

// Route 1: Send user to Google Login Screen
router.get('/google', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Crucial: gets the refresh_token for background syncing
        prompt: 'consent',      // Forces the consent screen so we always get a refresh token
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/drive.appdata'
        ]
    });
    res.redirect(url);
});

// Route 2: Google sends the user back here with a code
router.get('/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
        // Exchange the code for actual access tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Fetch the user's basic profile (Name, ID, etc.)
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        // Store Google's tokens in server memory linked to their Google ID
        global.userTokens[userInfo.data.id] = tokens;

        // Create our own Olva JWT to send to the frontend
        const payload = {
            id: userInfo.data.id,
            name: userInfo.data.name,
            picture: userInfo.data.picture
        };
        const olvaToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.redirect(`/app.html?token=${olvaToken}`);

    } catch (error) {
        console.error("Auth error:", error);
        res.status(500).send("Authentication failed. Check your terminal for details.");
    }
});

module.exports = router;
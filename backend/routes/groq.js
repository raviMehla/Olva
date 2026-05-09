const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

// POST /api/ask
// We apply verifyToken so only logged-in Google users can use your API
router.post('/ask', verifyToken, async (req, res) => {
    const { messages, model } = req.body;

    if (!messages || !model) {
        return res.status(400).json({ error: "Messages and model are required." });
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: true // This tells Groq to send data word-by-word
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Groq API Error:", errorText);
            return res.status(response.status).send("Error communicating with AI provider.");
        }

        // Setup headers for Server-Sent Events (Streaming)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Pipe the Groq stream directly to the frontend
        response.body.pipeTo(new WritableStream({
            write(chunk) {
                res.write(chunk);
            },
            close() {
                res.end();
            }
        }));

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
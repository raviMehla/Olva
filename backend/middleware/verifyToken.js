const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    // Look for the token in the headers
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ error: 'Access Denied: No token provided' });

    const token = authHeader.split(' ')[1]; // Format is "Bearer <token>"
    if (!token) return res.status(401).json({ error: 'Access Denied: Malformed token' });

    try {
        // Verify the token using your secret key
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Attach the user data (id, name) to the request
        next(); // Let them pass to the route
    } catch (err) {
        res.status(400).json({ error: 'Invalid Token' });
    }
}

module.exports = verifyToken;
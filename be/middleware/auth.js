const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_key_12345';

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Authorization: Bearer <token>

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(401).json({ message: 'Invalid or expired token' });
            }

            req.user = user;
            next();
        });
    } else {
        return res.status(401).json({ message: 'Authorization token is required' });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        next();
    };
};

module.exports = {
    authenticateJWT,
    requireRole,
    JWT_SECRET
};

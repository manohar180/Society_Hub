const authorize = (roles = []) => {
    // roles param can be a single role string or an array of roles
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated. User object missing.' });
        }

        if (roles.length && !roles.includes(req.user.role)) {
            // user's role is not authorized
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }

        // authentication and authorization successful
        next();
    };
};

module.exports = authorize;
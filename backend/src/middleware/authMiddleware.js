const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cinebook_dev_secret_key';

/**
 * Middleware to protect administrative routes using Bearer JWT tokens.
 */
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide a valid Bearer token.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Administrator privileges required.',
      });
    }
    req.admin = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
}

module.exports = {
  authenticateAdmin,
  JWT_SECRET,
};

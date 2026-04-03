const jwt = require('jsonwebtoken');

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  if (typeof header !== 'string') return '';
  if (header.toLowerCase().startsWith('bearer ')) return header.slice(7).trim();
  return header.trim();
}

function authRequired(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Missing Authorization token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  const role = req.user && req.user.role;
  if (role !== 'admin' && role !== 'super') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
}

module.exports = { authRequired, requireAdmin };


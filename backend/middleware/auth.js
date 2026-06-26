const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[1] !== 'null' && parts[1] !== 'undefined' && parts[1] !== '') {
      token = parts[1];
    } else {
      console.warn('[AUTH MIDDLEWARE] Received invalid token string value in Authorization header:', parts[1]);
    }
  } else {
    console.warn('[AUTH MIDDLEWARE] Authorization header is missing or does not start with Bearer. Headers:', req.headers);
  }

  if (!token) {
    console.warn('[AUTH MIDDLEWARE] Verification failed: Token is missing or invalid.');
    return res.status(401).json({ message: 'Not authorized, token missing or invalid' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'tyrehubsecret';
    const decoded = jwt.verify(token, secret);
    console.log('[AUTH MIDDLEWARE] Token successfully verified for decoded ID:', decoded.id);

    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      console.warn('[AUTH MIDDLEWARE] Token verified, but user ID not found in database:', decoded.id);
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    
    console.log('[AUTH MIDDLEWARE] User authenticated successfully:', req.user.email, 'Role:', req.user.role);
    next();
  } catch (error) {
    console.error('[AUTH MIDDLEWARE] Token verification failed. Error details:', error.message);
    res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Admin access required' });
};

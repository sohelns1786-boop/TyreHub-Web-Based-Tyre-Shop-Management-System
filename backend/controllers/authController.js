const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'tyrehubsecret', {
    expiresIn: '7d',
  });
};

exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: role || 'user' });
    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (
      error.name === 'MongoNetworkError' ||
      error.name === 'MongooseError' ||
      error.message.includes('buffering timed out') ||
      error.message.includes('connection')
    ) {
      return res.status(503).json({ message: 'Database is temporarily unavailable. Please try again later.' });
    }
    next(error);
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (
      error.name === 'MongoNetworkError' ||
      error.name === 'MongooseError' ||
      error.message.includes('buffering timed out') ||
      error.message.includes('connection')
    ) {
      return res.status(503).json({ message: 'Database is temporarily unavailable. Please try again later.' });
    }
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required for Google login' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Create a user record since they don't exist yet.
      // Schema requires a password, so we generate a random hashed one.
      const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const hashed = await bcrypt.hash(randomPassword, 10);
      
      // If the login is with admin@tyrehub.com, automatically promote them to admin for testing convenience.
      const role = email.toLowerCase() === 'admin@tyrehub.com' ? 'admin' : 'user';

      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: hashed,
        role: role,
      });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (
      error.name === 'MongoNetworkError' ||
      error.name === 'MongooseError' ||
      error.message.includes('buffering timed out') ||
      error.message.includes('connection')
    ) {
      return res.status(503).json({ message: 'Database is temporarily unavailable. Please try again later.' });
    }
    next(error);
  }
};


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

// --- Firebase Sync Helper and Endpoint ---

const https = require('https');

let googlePublicKeys = null;
let keysExpiry = 0;

const fetchGoogleKeys = () => {
  return new Promise((resolve, reject) => {
    https.get('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => reject(err));
  });
};

const getGooglePublicKeys = async () => {
  const now = Date.now();
  if (googlePublicKeys && now < keysExpiry) {
    return googlePublicKeys;
  }
  try {
    const keys = await fetchGoogleKeys();
    googlePublicKeys = keys;
    keysExpiry = now + 3600 * 1000;
    return googlePublicKeys;
  } catch (error) {
    console.error('[FIREBASE AUTH] Failed to fetch Google public keys:', error.message);
    throw new Error('Failed to retrieve Firebase public certificates');
  }
};

const verifyFirebaseToken = async (token) => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.header || !decoded.header.kid) {
    throw new Error('Invalid token structure');
  }

  if (!projectId || global.useMockDB) {
    console.warn('[FIREBASE AUTH] Verification bypassed. (No FIREBASE_PROJECT_ID in backend env, or Mock DB enabled). Decoding payload directly.');
    return decoded.payload;
  }

  const kid = decoded.header.kid;
  const keys = await getGooglePublicKeys();
  const publicKey = keys[kid];
  if (!publicKey) {
    throw new Error('Firebase token signed with unknown key ID');
  }

  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  });
};

exports.syncFirebaseUser = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.body.idToken) {
      token = req.body.idToken;
    }

    if (!token) {
      return res.status(400).json({ message: 'Firebase ID Token is required for synchronization' });
    }

    let payload;
    try {
      payload = await verifyFirebaseToken(token);
    } catch (err) {
      console.error('[FIREBASE AUTH] Token verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid or expired Firebase ID Token' });
    }

    const { uid, email, name, picture } = payload;
    if (!email) {
      return res.status(400).json({ message: 'Email address is missing from the Firebase token' });
    }

    let user = await User.findOne({ $or: [{ uid }, { email: email.toLowerCase() }] });

    const adminEmails = [
      'admin@tyrehub.com',
      'rasheedtyresplanet@gmail.com',
      'sohelns1786@gmail.com'
    ];
    const isMatchedAdmin = adminEmails.includes(email.toLowerCase());

    if (user) {
      user.uid = uid;
      user.name = name || user.name || email.split('@')[0];
      if (picture && !user.profilePhoto) {
        user.profilePhoto = picture;
      }
      user.lastLogin = new Date();
      if (isMatchedAdmin && user.role !== 'admin') {
        user.role = 'admin';
      }
      await user.save();
    } else {
      const role = isMatchedAdmin ? 'admin' : 'user';
      user = await User.create({
        uid,
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        profilePhoto: picture || '',
        role,
        lastLogin: new Date(),
      });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
        lastLogin: user.lastLogin,
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



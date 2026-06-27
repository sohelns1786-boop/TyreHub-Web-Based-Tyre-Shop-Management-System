const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: false },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    uid: { type: String, unique: true, sparse: true },
    profilePhoto: { type: String },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

const UserModel = mongoose.model('User', userSchema);

module.exports = new Proxy(UserModel, {
  get(target, prop) {
    if (global.useMockDB) {
      const MockModel = require('../config/mockModel');
      if (!global._mockUser) {
        global._mockUser = new MockModel('User');
      }
      return global._mockUser[prop];
    }
    return target[prop];
  }
});

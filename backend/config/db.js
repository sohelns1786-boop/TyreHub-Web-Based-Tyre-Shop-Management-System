const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Support both MONGODB_URI and MONGO_URI
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tyrehub';

let isInitialConnection = true;

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
  global.useMockDB = false;
});

mongoose.connection.on('error', (err) => {
  if (isInitialConnection) {
    // Handled in catch block of connectDB
    return;
  }
  console.error('MongoDB connection failed');
});

mongoose.connection.on('disconnected', () => {
  console.log('Reconnecting...');
});

const connectDB = async () => {
  // Prevent mongoose from buffering queries when not connected
  mongoose.set('bufferCommands', false);

  try {
    isInitialConnection = true;
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB is down
    });
    global.useMockDB = false;
    isInitialConnection = false;
    return conn;
  } catch (error) {
    console.error('MongoDB connection failed');
    console.warn(`\n[WARNING] MongoDB connection failed: ${error.message}`);
    console.warn(`[INFO] Operating in Mock/JSON File Database Mode instead.`);
    global.useMockDB = true;
    isInitialConnection = false;
  }
};

module.exports = connectDB;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');

const startServer = async () => {
  // Ensure mongoose.connect() is called and connection state is resolved before routes are loaded
  await connectDB();

  // Load routes and middleware after connection setup
  const authRoutes = require('./routes/authRoutes');
  const productRoutes = require('./routes/productRoutes');
  const serviceRoutes = require('./routes/serviceRoutes');
  const enquiryRoutes = require('./routes/enquiryRoutes');
  const adminRoutes = require('./routes/adminRoutes');
  const saleRoutes = require('./routes/saleRoutes');
  const { notFound, errorHandler } = require('./middleware/error');

  console.log(`[DEBUG] Loaded JWT_SECRET: ${process.env.JWT_SECRET ? 'Yes (starts with ' + process.env.JWT_SECRET.substring(0, 3) + ')' : 'No (using fallback)'}`);

  const app = express();
  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  app.get('/', (req, res) => {
    res.json({ message: 'TyreHub API is running' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/enquiries', enquiryRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/sales', saleRoutes);

  // Serve uploaded images
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Serve frontend build in production
  if (process.env.NODE_ENV === 'production') {
    const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
    app.use(express.static(frontendDist));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return res.status(404).json({ message: 'Not found' });
      }
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});

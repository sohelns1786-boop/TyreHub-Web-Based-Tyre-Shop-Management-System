const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const Service = require('./models/Service');
const Enquiry = require('./models/Enquiry');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const seedData = async () => {
  await connectDB();

  await User.deleteMany();
  await Product.deleteMany();
  await Service.deleteMany();
  await Enquiry.deleteMany();

  const adminPassword = await bcrypt.hash('admin123', 12);
  await User.create({
    name: 'TyreHub Admin',
    email: 'admin@tyrehub.com',
    password: adminPassword,
    role: 'admin',
  });
  // Additional admin accounts requested
  await User.create({
    name: 'Rasheed Tyres Admin',
    email: 'rasheedtyresplanet@gmail.com',
    password: adminPassword,
    role: 'admin',
  });
  await User.create({
    name: 'Sohel NS Admin',
    email: 'sohelns1786@gmail.com',
    password: adminPassword,
    role: 'admin',
  });

  const products = [
    {
      name: 'MRF Rider Pro',
      brand: 'MRF',
      category: 'Bike Tyres',
      vehicleType: 'Bike',
      size: '2.75-18',
      price: 2499,
      stock: 18,
      description: 'High-performance bike tyre built for excellent grip and wet traction.',
      image: '/uploads/mrf_bike.png',
    },
    {
      name: 'CEAT Milaze Touring',
      brand: 'CEAT',
      category: 'Car Tyres',
      vehicleType: 'Car',
      size: '185/65R15',
      price: 6799,
      stock: 7,
      description: 'Comfort-oriented car tyre with strong wet traction and low noise.',
      image: '/uploads/ceat_car.png',
    },
    {
      name: 'Apollo Alnac 4G',
      brand: 'Apollo Tyres',
      category: 'Car Tyres',
      vehicleType: 'Car',
      size: '195/55R16',
      price: 7599,
      stock: 4,
      description: 'Balanced car tyre for smooth high-speed stability and fuel efficiency.',
      image: '/uploads/apollo_car.png',
    },
    {
      name: 'JK Tyre ECOWING',
      brand: 'JK Tyre',
      category: 'Bike Tyres',
      vehicleType: 'Bike',
      size: '100/90-18',
      price: 2299,
      stock: 5,
      description: 'Premium commuter bike tyre engineered for long mileage and stability.',
      image: '/uploads/jk_bike.png',
    },
    {
      name: 'Bridgestone Turanza',
      brand: 'Bridgestone',
      category: 'Car Tyres',
      vehicleType: 'Car',
      size: '205/55R16',
      price: 8399,
      stock: 3,
      description: 'Premium comfort tyre with excellent dry and wet grip.',
      image: '/uploads/bridgestone_car.png',
    },
    {
      name: 'MRF Auto Grip',
      brand: 'MRF',
      category: 'Auto Tyres',
      vehicleType: 'Auto',
      size: '4.00-10',
      price: 1999,
      stock: 9,
      description: 'Robust auto-rickshaw tyre ideal for city roads and high load capacity.',
      image: '/uploads/mrf_auto.png',
    },
    {
      name: 'CEAT Comfort 4F',
      brand: 'CEAT',
      category: 'Lorry Tyres',
      vehicleType: 'Lorry',
      size: '11R22.5',
      price: 14999,
      stock: 2,
      description: 'Heavy-duty commercial tyre built for long haul durability and stability.',
      image: '/uploads/ceat_lorry.png',
    },
    {
      name: 'Bridgestone Battlax Auto',
      brand: 'Bridgestone',
      category: 'Auto Tyres',
      vehicleType: 'Auto',
      size: '4.00-10',
      price: 2199,
      stock: 10,
      description: 'Premium auto tyre providing comfortable city rides and high reliability.',
      image: '/uploads/bridgestone_auto.png',
    },
    {
      name: 'Apollo ActiGrip R',
      brand: 'Apollo Tyres',
      category: 'Bike Tyres',
      vehicleType: 'Bike',
      size: '90/90-12',
      price: 1899,
      stock: 15,
      description: 'Rugged tread pattern for superior commuter grip and durability.',
      image: '/uploads/jk_bike.png',
    },
    {
      name: 'Bridgestone Battlax Sport',
      brand: 'Bridgestone',
      category: 'Bike Tyres',
      vehicleType: 'Bike',
      size: '120/70-17',
      price: 5499,
      stock: 6,
      description: 'High-performance sport radial tyre with exceptional dry/wet cornering grip.',
      image: '/uploads/mrf_bike.png',
    },
    {
      name: 'CEAT Zoom XL',
      brand: 'CEAT',
      category: 'Bike Tyres',
      vehicleType: 'Bike',
      size: '140/70-17',
      price: 3499,
      stock: 8,
      description: 'Premium rear tyre for sports bikes offering enhanced stability and life.',
      image: '/uploads/jk_bike.png',
    },
    {
      name: 'MRF Wanderer SUV',
      brand: 'MRF',
      category: 'Car Tyres',
      vehicleType: 'Car',
      size: '215/65R16',
      price: 8899,
      stock: 10,
      description: 'All-terrain SUV tyre designed for rugged off-road traction and highway comfort.',
      image: '/uploads/apollo_car.png',
    },
    {
      name: 'JK Tyre UX Royale',
      brand: 'JK Tyre',
      category: 'Car Tyres',
      vehicleType: 'Car',
      size: '185/60R15',
      price: 4899,
      stock: 11,
      description: 'Premium ride-comfort car tyre with high acoustic performance and mileage.',
      image: '/uploads/ceat_car.png',
    },
    {
      name: 'Apollo Apterra HP',
      brand: 'Apollo Tyres',
      category: 'Car Tyres',
      vehicleType: 'Car',
      size: '235/65R17',
      price: 10999,
      stock: 5,
      description: 'High-speed luxury SUV tyre offering precise handling and safety.',
      image: '/uploads/apollo_car.png',
    },
    {
      name: 'CEAT Anura Rickshaw',
      brand: 'CEAT',
      category: 'Auto Tyres',
      vehicleType: 'Auto',
      size: '4.00-8',
      price: 1699,
      stock: 20,
      description: 'Reliable auto rickshaw tyre with strong compound for extra mileage.',
      image: '/uploads/mrf_auto.png',
    },
    {
      name: 'JK Tyre Jumbo King',
      brand: 'JK Tyre',
      category: 'Auto Tyres',
      vehicleType: 'Auto',
      size: '4.50-10',
      price: 2399,
      stock: 14,
      description: 'Heavy-duty auto rickshaw tyre providing excellent stability under load.',
      image: '/uploads/bridgestone_auto.png',
    },
    {
      name: 'MRF Steel Muscle S3',
      brand: 'MRF',
      category: 'Lorry Tyres',
      vehicleType: 'Lorry',
      size: '10.00R20',
      price: 19999,
      stock: 4,
      description: 'All-wheel position premium radial truck tyre for highway applications.',
      image: '/uploads/ceat_lorry.png',
    },
    {
      name: 'Apollo EnduRace LD',
      brand: 'Apollo Tyres',
      category: 'Lorry Tyres',
      vehicleType: 'Lorry',
      size: '295/80R22.5',
      price: 23999,
      stock: 3,
      description: 'Premium drive axle commercial tyre designed for high mileage and retreadability.',
      image: '/uploads/ceat_lorry.png',
    },
  ];

  const services = [
    {
      name: 'Wheel Alignment',
      description: 'Precision wheel alignment for balanced steering and longer tyre life.',
      image: 'https://via.placeholder.com/500x300?text=Wheel+Alignment',
    },
    {
      name: 'Wheel Balancing',
      description: 'Professional balancing for smoother ride quality and tyre safety.',
      image: 'https://via.placeholder.com/500x300?text=Wheel+Balancing',
    },
    {
      name: 'Nitrogen Filling',
      description: 'Nitrogen inflation for stable pressure and cooler running temperatures.',
      image: 'https://via.placeholder.com/500x300?text=Nitrogen+Filling',
    },
    {
      name: 'Puncture Repair',
      description: 'Fast puncture repair using trusted materials to get you back on road.',
      image: 'https://via.placeholder.com/500x300?text=Puncture+Repair',
    },
    {
      name: 'Tyre Replacement',
      description: 'Full tyre replacement service with the right fit and expert fitting.',
      image: 'https://via.placeholder.com/500x300?text=Tyre+Replacement',
    },
  ];

  const enquiries = [
    {
      name: 'Suresh Kumar',
      phone: '9182736329',
      message: 'Can you suggest the best car tyre under 5000?',
    },
    {
      name: 'Anita Reddy',
      phone: '9123456780',
      message: 'Do you provide same-day tyre replacement for trucks?',
    },
  ];

  await Product.insertMany(products);
  await Service.insertMany(services);
  await Enquiry.insertMany(enquiries);

  console.log('Database seeded successfully');
  process.exit();
};

seedData().catch((error) => {
  console.error(error);
  process.exit(1);
});

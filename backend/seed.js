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

const BRANDS = ['MRF', 'CEAT', 'Apollo Tyres', 'JK Tyre', 'Bridgestone'];
const VEHICLE_CATEGORIES = [
  { v: 'Bike', c: 'Bike Tyres', sizes: ['2.75-18', '90/90-12', '100/90-18', '120/70-17', '140/70-17', '3.00-18', '80/100-18'] },
  { v: 'Car', c: 'Car Tyres', sizes: ['185/65R15', '195/55R16', '205/55R16', '215/65R16', '185/60R15', '235/65R17', '175/65R14', '165/80R14'] },
  { v: 'Auto', c: 'Auto Tyres', sizes: ['4.00-10', '4.00-8', '4.50-10', '4.50-12'] },
  { v: 'Lorry', c: 'Lorry Tyres', sizes: ['11R22.5', '10.00R20', '295/80R22.5', '9.00R20', '315/80R22.5'] },
];

const BRAND_IMAGE_MAP = {
  'MRF': { Bike: '/uploads/mrf_bike.png', Car: '/uploads/mrf_car.png', Auto: '/uploads/mrf_auto.png', Lorry: '/uploads/mrf_lorry.png' },
  'CEAT': { Bike: '/uploads/ceat_bike.png', Car: '/uploads/ceat_car.png', Auto: '/uploads/ceat_auto.png', Lorry: '/uploads/ceat_lorry.png' },
  'Apollo Tyres': { Bike: '/uploads/apollo_bike.png', Car: '/uploads/apollo_car.png', Auto: '/uploads/apollo_auto.png', Lorry: '/uploads/apollo_lorry.png' },
  'JK Tyre': { Bike: '/uploads/jk_bike.png', Car: '/uploads/jk_car.png', Auto: '/uploads/jk_auto.png', Lorry: '/uploads/jk_lorry.png' },
  'Bridgestone': { Bike: '/uploads/bridgestone_bike.png', Car: '/uploads/bridgestone_car.png', Auto: '/uploads/bridgestone_auto.png', Lorry: '/uploads/bridgestone_lorry.png' }
};

const FALLBACK_IMG = {
  'Bike': '/images/tyres/bike.png',
  'Car': '/images/tyres/car.png',
  'Auto': '/images/tyres/auto.png',
  'Lorry': '/images/tyres/lorry.png'
};

const BRAND_PREFIX = {
  'MRF': 'Zapper', 'CEAT': 'Milaze', 'Apollo Tyres': 'Alnac', 'JK Tyre': 'UX', 'Bridgestone': 'Turanza'
};

const generateProducts = () => {
  const products = [];
  let pId = 1;

  for (const brand of BRANDS) {
    for (const catObj of VEHICLE_CATEGORIES) {
      for (let i = 0; i < 5; i++) {
        const size = catObj.sizes[i % catObj.sizes.length];
        const isTubeless = Math.random() > 0.3; 
        
        let basePrice = 0;
        if (catObj.v === 'Bike') basePrice = 1500 + Math.floor(Math.random() * 2000);
        else if (catObj.v === 'Car') basePrice = 4000 + Math.floor(Math.random() * 6000);
        else if (catObj.v === 'Auto') basePrice = 1200 + Math.floor(Math.random() * 1500);
        else if (catObj.v === 'Lorry') basePrice = 12000 + Math.floor(Math.random() * 10000);

        const discount = Math.floor(Math.random() * 15);
        const mrp = Math.floor(basePrice * (1 + (discount/100)) + 500);
        
        const sku = `${brand.substring(0,3).toUpperCase()}-${catObj.v.substring(0,3).toUpperCase()}-${1000 + pId}`;
        
        products.push({
          name: `${brand} ${BRAND_PREFIX[brand] || 'Grip'} Pro ${catObj.v} Tyre`,
          brand: brand,
          category: catObj.c,
          vehicleType: catObj.v,
          size: size,
          price: basePrice,
          mrp: mrp,
          discount: discount,
          stock: Math.floor(Math.random() * 50),
          sku: sku,
          productCode: `P-${pId.toString().padStart(4, '0')}`,
          tyreType: isTubeless ? 'Tubeless' : 'Tube Type',
          specifications: `Speed Rating: ${catObj.v === 'Car' ? 'H' : 'P'} | Load Index: ${catObj.v === 'Lorry' ? '146' : '90'}`,
          warranty: '5 Years Manufacturer Warranty',
          description: `Premium high-quality ${catObj.v.toLowerCase()} tyre offering exceptional grip, durability, and a smooth ride on all terrains. Manufactured by ${brand}.`,
          image: FALLBACK_IMG[catObj.v],
          images: [
            FALLBACK_IMG[catObj.v],
            BRAND_IMAGE_MAP[brand][catObj.v] || FALLBACK_IMG[catObj.v]
          ]
        });
        pId++;
      }
    }
  }
  return products;
};

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

  const products = generateProducts();

  const services = [
    { name: 'Wheel Alignment', description: 'Precision wheel alignment for balanced steering and longer tyre life.', image: 'https://images.unsplash.com/photo-1599818817743-1bf52762eb2f?auto=format&fit=crop&q=80&w=800' },
    { name: 'Wheel Balancing', description: 'Professional balancing for smoother ride quality and tyre safety.', image: 'https://images.unsplash.com/photo-1592003716616-9b819f77f374?auto=format&fit=crop&q=80&w=800' },
    { name: 'Nitrogen Filling', description: 'Nitrogen inflation for stable pressure and cooler running temperatures.', image: 'https://images.unsplash.com/photo-1621532873981-d1448b1bf762?auto=format&fit=crop&q=80&w=800' },
    { name: 'Puncture Repair', description: 'Fast puncture repair using trusted materials to get you back on road.', image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=800' },
  ];

  await Product.insertMany(products);
  await Service.insertMany(services);

  console.log(`Database seeded successfully with ${products.length} products!`);
  process.exit();
};

seedData().catch((error) => {
  console.error(error);
  process.exit(1);
});

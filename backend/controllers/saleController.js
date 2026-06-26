const Sale = require('../models/Sale');
const Product = require('../models/Product');

// @desc    Record a new sale
// @route   POST /api/sales
// @access  Private/Admin
exports.createSale = async (req, res, next) => {
  try {
    const { productId, customerName, customerPhone, quantity, unitPrice, paymentMethod, status } = req.body;

    // 1. Validation
    if (!productId || !customerName || !customerPhone || !quantity || !unitPrice || !paymentMethod) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const qtyNum = Number(quantity);
    if (isNaN(qtyNum) || qtyNum < 1) {
      return res.status(400).json({ message: 'Quantity must be a positive integer' });
    }

    const priceNum = Number(unitPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ message: 'Unit price must be a non-negative number' });
    }

    // 2. Fetch product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const saleStatus = status || 'Completed';

    // 3. Check stock if sale is Completed
    if (saleStatus === 'Completed') {
      if (product.stock < qtyNum) {
        return res.status(400).json({
          message: `Insufficient stock for this tyre. Only ${product.stock} left in inventory.`
        });
      }
    }

    // 4. Generate Invoice Number (Format: INV-YYYYMMDD-XXXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randStr = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randStr}`;

    // 5. Calculate total
    const totalAmount = qtyNum * priceNum;

    // 6. Set salesperson name
    const salesperson = req.user ? req.user.name : 'Administrator';

    // 7. Adjust stock if Completed
    if (saleStatus === 'Completed') {
      product.stock = Math.max(0, product.stock - qtyNum);
      await product.save();
    }

    // 8. Create sale record
    const sale = await Sale.create({
      invoiceNumber,
      customerName,
      customerPhone,
      productId,
      productName: product.name,
      brand: product.brand,
      category: product.category,
      size: product.size,
      quantity: qtyNum,
      unitPrice: priceNum,
      totalAmount,
      paymentMethod,
      salesperson,
      status: saleStatus
    });

    console.log(`[SALES MODULE] Created sale ${sale.invoiceNumber} for ${qtyNum} tyres. Stock reduced.`);
    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all sales with filtering, searching, and pagination
// @route   GET /api/sales
// @access  Private/Admin
exports.getSales = async (req, res, next) => {
  try {
    const { search, brand, category, paymentMethod, status, startDate, endDate, page, limit } = req.query;
    const filters = {};

    // 1. Text Search (matches invoice, customer name, or product name)
    if (search) {
      filters.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } }
      ];
    }

    // 2. Exact match filters
    if (brand && brand !== 'All') filters.brand = brand;
    if (category && category !== 'All') filters.category = category;
    if (paymentMethod && paymentMethod !== 'All') filters.paymentMethod = paymentMethod;
    if (status && status !== 'All') filters.status = status;

    // 3. Date range filter
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) {
        filters.createdAt.$gte = new Date(startDate).toISOString();
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filters.createdAt.$lte = end.toISOString();
      }
    }

    // 4. Fetch and Sort (all results first to support mock DB pagination compatibility)
    const sales = await Sale.find(filters).sort({ createdAt: -1 });

    // 5. Manual pagination (safe for both MockQuery and Mongoose arrays)
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const totalCount = sales.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedSales = sales.slice(startIndex, startIndex + limitNum);

    res.json({
      sales: paginatedSales,
      page: pageNum,
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single sale by ID
// @route   GET /api/sales/:id
// @access  Private/Admin
exports.getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sales record not found' });
    }
    res.json(sale);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a sales record and auto-adjust product inventory
// @route   PUT /api/sales/:id
// @access  Private/Admin
exports.updateSale = async (req, res, next) => {
  try {
    const { customerName, customerPhone, quantity, unitPrice, paymentMethod, status } = req.body;
    
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sales record not found' });
    }

    const product = await Product.findById(sale.productId);
    if (!product) {
      return res.status(404).json({ message: 'Associated tyre product not found. Cannot verify stock changes.' });
    }

    const oldStatus = sale.status;
    const oldQty = sale.quantity;
    const newStatus = status || sale.status;
    const newQty = quantity !== undefined ? Number(quantity) : sale.quantity;
    const newPrice = unitPrice !== undefined ? Number(unitPrice) : sale.unitPrice;

    if (isNaN(newQty) || newQty < 1) {
      return res.status(400).json({ message: 'Quantity must be a positive integer' });
    }
    if (isNaN(newPrice) || newPrice < 0) {
      return res.status(400).json({ message: 'Unit price must be a non-negative number' });
    }

    // Handle stock correction logic
    if (oldStatus === 'Completed' && newStatus === 'Completed') {
      const qtyDiff = oldQty - newQty; // positive means we returned stock, negative means we sold more
      if (qtyDiff < 0) {
        // We sold more, check stock
        const needed = Math.abs(qtyDiff);
        if (product.stock < needed) {
          return res.status(400).json({
            message: `Insufficient stock to increase sale quantity. Only ${product.stock} left in inventory.`
          });
        }
      }
      product.stock = Math.max(0, product.stock + qtyDiff);
      await product.save();
    } 
    else if (oldStatus === 'Completed' && newStatus !== 'Completed') {
      // Sale cancelled/refunded, add all sold stock back
      product.stock = product.stock + oldQty;
      await product.save();
    } 
    else if (oldStatus !== 'Completed' && newStatus === 'Completed') {
      // Sale re-completed, check and subtract stock
      if (product.stock < newQty) {
        return res.status(400).json({
          message: `Insufficient stock to mark sale as Completed. Only ${product.stock} left.`
        });
      }
      product.stock = Math.max(0, product.stock - newQty);
      await product.save();
    }
    // If oldStatus !== 'Completed' && newStatus !== 'Completed', no stock update is needed.

    // Apply updates
    sale.customerName = customerName !== undefined ? customerName.trim() : sale.customerName;
    sale.customerPhone = customerPhone !== undefined ? customerPhone.trim() : sale.customerPhone;
    sale.quantity = newQty;
    sale.unitPrice = newPrice;
    sale.totalAmount = newQty * newPrice;
    sale.paymentMethod = paymentMethod || sale.paymentMethod;
    sale.status = newStatus;

    await sale.save();
    console.log(`[SALES MODULE] Updated sale ${sale.invoiceNumber}. Stock values recalculated.`);
    
    res.json(sale);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete sales record and restore stock if completed
// @route   DELETE /api/sales/:id
// @access  Private/Admin
exports.deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sales record not found' });
    }

    // Restore stock if the deleted sale was completed
    if (sale.status === 'Completed') {
      const product = await Product.findById(sale.productId);
      if (product) {
        product.stock = product.stock + sale.quantity;
        await product.save();
        console.log(`[SALES MODULE] Sale ${sale.invoiceNumber} deleted. Restored ${sale.quantity} stock items to product.`);
      }
    }

    await sale.remove();
    res.json({ message: 'Sales record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales analytics and time-series trend data
// @route   GET /api/sales/stats
// @access  Private/Admin
exports.getSalesStats = async (req, res, next) => {
  try {
    const sales = await Sale.find();
    const completedSales = sales.filter(s => s.status === 'Completed');

    // 1. Core Analytics Cards Calculations
    const totalRevenue = completedSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalTyresSold = completedSales.reduce((acc, s) => acc + s.quantity, 0);

    const today = new Date();
    
    // Today's Sales
    const todaySales = completedSales.filter(s => {
      const d = new Date(s.createdAt);
      return d.getDate() === today.getDate() &&
             d.getMonth() === today.getMonth() &&
             d.getFullYear() === today.getFullYear();
    });
    const todayRevenue = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
    const todayQty = todaySales.reduce((acc, s) => acc + s.quantity, 0);

    // Weekly Sales (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklySales = completedSales.filter(s => new Date(s.createdAt) >= oneWeekAgo);
    const weeklyRevenue = weeklySales.reduce((acc, s) => acc + s.totalAmount, 0);
    const weeklyQty = weeklySales.reduce((acc, s) => acc + s.quantity, 0);

    // Monthly Sales (last 30 days)
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const monthlySales = completedSales.filter(s => new Date(s.createdAt) >= oneMonthAgo);
    const monthlyRevenue = monthlySales.reduce((acc, s) => acc + s.totalAmount, 0);
    const monthlyQty = monthlySales.reduce((acc, s) => acc + s.quantity, 0);

    // Top Selling Brand
    const brandMap = {};
    completedSales.forEach(s => {
      brandMap[s.brand] = (brandMap[s.brand] || 0) + s.quantity;
    });
    let topBrand = 'N/A';
    let maxBrandQty = 0;
    for (const [brand, qty] of Object.entries(brandMap)) {
      if (qty > maxBrandQty) {
        maxBrandQty = qty;
        topBrand = brand;
      }
    }

    // Top Selling Product
    const productMap = {};
    completedSales.forEach(s => {
      productMap[s.productName] = (productMap[s.productName] || 0) + s.quantity;
    });
    let topProduct = 'N/A';
    let maxProductQty = 0;
    for (const [product, qty] of Object.entries(productMap)) {
      if (qty > maxProductQty) {
        maxProductQty = qty;
        topProduct = product;
      }
    }

    // Recent 5 Sales (sorted descending, can include cancelled/refunded for audit visibility)
    const recentSales = [...sales]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // 2. Chart Trend Calculations

    // Daily trends (last 7 days)
    const dailyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      const daySales = completedSales.filter(s => {
        const sd = new Date(s.createdAt);
        return sd.getDate() === d.getDate() &&
               sd.getMonth() === d.getMonth() &&
               sd.getFullYear() === d.getFullYear();
      });
      
      dailyTrends.push({
        label: dayLabel,
        revenue: daySales.reduce((acc, s) => acc + s.totalAmount, 0),
        quantity: daySales.reduce((acc, s) => acc + s.quantity, 0)
      });
    }

    // Weekly trends (last 4 weeks)
    const weeklyTrends = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      
      const weekSales = completedSales.filter(s => {
        const sd = new Date(s.createdAt);
        return sd >= start && sd <= end;
      });
      
      weeklyTrends.push({
        label: i === 0 ? 'This Week' : `${i} Wk${i > 1 ? 's' : ''} Ago`,
        revenue: weekSales.reduce((acc, s) => acc + s.totalAmount, 0),
        quantity: weekSales.reduce((acc, s) => acc + s.quantity, 0)
      });
    }

    // Monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const monthSales = completedSales.filter(s => {
        const sd = new Date(s.createdAt);
        return sd.getMonth() === d.getMonth() &&
               sd.getFullYear() === d.getFullYear();
      });
      
      monthlyTrends.push({
        label: monthLabel,
        revenue: monthSales.reduce((acc, s) => acc + s.totalAmount, 0),
        quantity: monthSales.reduce((acc, s) => acc + s.quantity, 0)
      });
    }

    // Yearly trends (last 5 years)
    const yearlyTrends = [];
    const currentYear = new Date().getFullYear();
    for (let i = 4; i >= 0; i--) {
      const yr = currentYear - i;
      const yrSales = completedSales.filter(s => new Date(s.createdAt).getFullYear() === yr);
      
      yearlyTrends.push({
        label: String(yr),
        revenue: yrSales.reduce((acc, s) => acc + s.totalAmount, 0),
        quantity: yrSales.reduce((acc, s) => acc + s.quantity, 0)
      });
    }

    res.json({
      cards: {
        totalRevenue,
        totalTyresSold,
        todaySales: { revenue: todayRevenue, quantity: todayQty },
        weeklySales: { revenue: weeklyRevenue, quantity: weeklyQty },
        monthlySales: { revenue: monthlyRevenue, quantity: monthlyQty },
        topBrand: { name: topBrand, quantity: maxBrandQty },
        topProduct: { name: topProduct, quantity: maxProductQty }
      },
      recentSales,
      charts: {
        daily: dailyTrends,
        weekly: weeklyTrends,
        monthly: monthlyTrends,
        yearly: yearlyTrends
      }
    });
  } catch (error) {
    next(error);
  }
};

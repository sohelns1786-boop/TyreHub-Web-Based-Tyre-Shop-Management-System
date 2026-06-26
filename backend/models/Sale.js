const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card'], required: true },
    salesperson: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Completed', 'Cancelled', 'Refunded'], default: 'Completed' },
  },
  { timestamps: true }
);

const SaleModel = mongoose.model('Sale', saleSchema);

module.exports = new Proxy(SaleModel, {
  get(target, prop) {
    if (global.useMockDB) {
      const MockModel = require('../config/mockModel');
      if (!global._mockSale) {
        global._mockSale = new MockModel('Sale');
      }
      return global._mockSale[prop];
    }
    return target[prop];
  }
});

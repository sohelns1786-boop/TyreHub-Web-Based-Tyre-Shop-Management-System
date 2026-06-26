const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    image: { type: String, trim: true },
  },
  { timestamps: true }
);

const ServiceModel = mongoose.model('Service', serviceSchema);

module.exports = new Proxy(ServiceModel, {
  get(target, prop) {
    if (global.useMockDB) {
      const MockModel = require('../config/mockModel');
      if (!global._mockService) {
        global._mockService = new MockModel('Service');
      }
      return global._mockService[prop];
    }
    return target[prop];
  }
});

const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const EnquiryModel = mongoose.model('Enquiry', enquirySchema);

module.exports = new Proxy(EnquiryModel, {
  get(target, prop) {
    if (global.useMockDB) {
      const MockModel = require('../config/mockModel');
      if (!global._mockEnquiry) {
        global._mockEnquiry = new MockModel('Enquiry');
      }
      return global._mockEnquiry[prop];
    }
    return target[prop];
  }
});

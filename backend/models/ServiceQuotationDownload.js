const mongoose = require('mongoose');

const serviceQuotationDownloadSchema = new mongoose.Schema({
  serviceBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceBooking' },
  service:        { type: mongoose.Schema.Types.ObjectId, ref: 'VendorService' },
  vendor:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customer:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  quotationNumber: String,
  action: { type: String, enum: ['download', 'print'], default: 'download' },
  totalAmount: Number,

  // Snapshots
  serviceSnapshot: { title: String, category: String, companyName: String, city: String, state: String },
  customerSnapshot: { name: String, email: String, phone: String, company: String, eventName: String },
  eventDate: Date,

  // Price snapshot
  priceSnapshot: {
    subtotal: Number, serviceCGST: Number, serviceSGST: Number,
    platformFee: Number, platformFeeGST: Number,
    discount: Number, couponCode: String, total: Number,
  },

  downloadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('ServiceQuotationDownload', serviceQuotationDownloadSchema);

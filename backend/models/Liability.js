const mongoose = require('mongoose');

const liabilitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    payByDate: { type: Date },
    remark: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    serviceBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceBooking' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Liability', liabilitySchema);


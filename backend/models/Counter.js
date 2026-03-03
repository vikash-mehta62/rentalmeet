const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  sequence: {
    type: Number,
    default: 0
  },
  year: {
    type: Number
  },
  state: {
    type: String
  },
  city: {
    type: String
  }
}, {
  timestamps: true
});

// Method to get next sequence number
counterSchema.statics.getNextSequence = async function(counterId) {
  const counter = await this.findByIdAndUpdate(
    counterId,
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence;
};

// Method to reset sequence for new year
counterSchema.statics.resetYearlySequence = async function(counterId, year) {
  await this.findByIdAndUpdate(
    counterId,
    { sequence: 0, year: year },
    { upsert: true }
  );
};

module.exports = mongoose.model('Counter', counterSchema);

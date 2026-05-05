const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    head: {
      type: String,
      required: true,
      trim: true
    },
    subHead: {
      type: String,
      trim: true,
      default: ''
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    remark: {
      type: String,
      trim: true,
      default: ''
    },
    expenseDate: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);

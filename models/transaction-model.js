import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  description: {
    type: String,
    required: [true, "Transaction description is required"],
    trim: true,
    minlength: [1, "Description cannot be empty"]
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    validate: {
      validator: function(v) {
        return v !== 0;
      },
      message: "Amount cannot be zero"
    }
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: [
      'Food & Dining',
      'Transportation', 
      'Shopping',
      'Entertainment',
      'Bills & Utilities',
      'Healthcare',
      'Income',
      'Other'
    ]
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, "Notes cannot exceed 500 characters"]
  }
}, {
  timestamps: true
});


transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, type: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
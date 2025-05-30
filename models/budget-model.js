import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
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
      'Other'
    ]
  },
  budgetAmount: {
    type: Number,
    required: [true, "Budget amount is required"],
    min: [0, "Budget amount cannot be negative"]
  },
  spentAmount: {
    type: Number,
    default: 0,
    min: [0, "Spent amount cannot be negative"]
  },
  period: {
    type: String,
    enum: ['monthly', 'weekly', 'yearly'],
    default: 'monthly'
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2020
  },
  alertThreshold: {
    type: Number,
    default: 80,
    min: 1,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for remaining budget
budgetSchema.virtual('remainingAmount').get(function() {
  return Math.max(this.budgetAmount - this.spentAmount, 0);
});

// Virtual for spent percentage
budgetSchema.virtual('spentPercentage').get(function() {
  return Math.min(Math.round((this.spentAmount / this.budgetAmount) * 100), 100);
});

// Virtual for budget status
budgetSchema.virtual('status').get(function() {
  const percentage = this.spentPercentage;
  if (percentage >= 100) return 'exceeded';
  if (percentage >= this.alertThreshold) return 'warning';
  return 'safe';
});

// Compound index for unique budget per category per month/year per user
budgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });

// Ensure virtuals are included in JSON
budgetSchema.set('toJSON', { virtuals: true });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
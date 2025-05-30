import mongoose from 'mongoose';

const goalProgressSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  note: {
    type: String,
    trim: true,
    maxlength: [200, "Note cannot exceed 200 characters"]
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  name: {
    type: String,
    required: [true, "Goal name is required"],
    trim: true,
    minlength: [2, "Goal name must be at least 2 characters long"],
    maxlength: [100, "Goal name cannot exceed 100 characters"]
  },
  target: {
    type: Number,
    required: [true, "Target amount is required"],
    min: [1, "Target amount must be greater than 0"]
  },
  current: {
    type: Number,
    default: 0,
    min: [0, "Current amount cannot be negative"]
  },
  deadline: {
    type: Date,
    required: [true, "Deadline is required"],
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: "Deadline must be in the future"
    }
  },
  icon: {
    type: String,
    default: 'PiggyBank'
  },
  color: {
    type: String,
    default: 'bg-blue-600'
  },
  progressHistory: [goalProgressSchema],
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  return Math.min(Math.round((this.current / this.target) * 100), 100);
});

// Virtual for remaining amount
goalSchema.virtual('remainingAmount').get(function() {
  return Math.max(this.target - this.current, 0);
});

// Index for better query performance
goalSchema.index({ userId: 1, status: 1 });

// Ensure virtuals are included in JSON
goalSchema.set('toJSON', { virtuals: true });

const Goal = mongoose.model('Goal', goalSchema);
export default Goal;
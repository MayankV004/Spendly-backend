import Transaction from "../models/transaction-model.js";
import mongoose from "mongoose";
export const getAllTransactions = async (req, res) => {
  try {
    const {
      category,
      type,
      startDate,
      endDate,
      search,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    const filter = { userId: req.user.id };

    if (category && category !== "all") {
      filter.category = category;
    }

    if (type && type !== "all") {
      filter.type = type;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (search) {
      filter.description = { $regex: search, $options: "i" };
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query without pagination
    const transactions = await Transaction.find(filter).sort(sortConfig);

    res.json({
      success: true,
      data: transactions,
      total: transactions.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching transactions",
      error: error.message,
    });
  }
};

export const getRecentTransactions = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching recent transactions",
      error: error.message,
    });
  }
};

export const getStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    
    
    const startOfMonth = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));
    
    
    
    const stats = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id), 
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);
    
    // console.log('Stats:', stats);    
    const categoryStats = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id), 
          type: "expense",
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: { $abs: "$amount" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);
    
    // console.log('Category Stats:', categoryStats);
    
    // Monthly trend (last 6 months) - also fix the date range
    const sixMonthsAgo = new Date(Date.UTC(targetYear, targetMonth - 7, 1, 0, 0, 0));
    
    const monthlyTrend = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          date: {
            $gte: sixMonthsAgo,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            year: { $year: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    
    const income = stats.find((s) => s._id === "income")?.total || 0;
    const expenses = Math.abs(
      stats.find((s) => s._id === "expense")?.total || 0
    );
    const savings = income - expenses;
    const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;
    
    res.json({
      success: true,
      data: {
        totalIncome: income,
        totalExpenses: expenses,
        totalSavings: savings,
        savingsRate: parseFloat(savingsRate),
        categoryBreakdown: categoryStats.map((cat) => ({
          name: cat._id,
          value: cat.total,
          count: cat.count,
        })),
        monthlyTrend: monthlyTrend,
      },
    });
  } catch (error) {
    console.error('Error in getStats:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching transaction statistics",
      error: error.message,
    });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const { description, amount, type, category, date, notes } = req.body;
    if (!description || !amount || !type || !category) {
      return res.status(400).json({
        success: false,
        message: "Description, amount, type, and category are required",
      });
    }

    const transaction = new Transaction({
      userId: req.user.id,
      description: description.trim(),
      amount: type === "expense" ? -Math.abs(amount) : Math.abs(amount),
      type,
      category,
      date: date || new Date(),
      notes: notes?.trim() || "",
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating transaction",
      error: error.message,
    });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, type, category, date, notes } = req.body;

    const existingTransaction = await Transaction.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      {
        description: description?.trim() || existingTransaction.description,
        amount: type
          ? type === "expense"
            ? -Math.abs(amount)
            : Math.abs(amount)
          : existingTransaction.amount,
        type: type || existingTransaction.type,
        category: category || existingTransaction.category,
        date: date || existingTransaction.date,
        notes: notes?.trim() || existingTransaction.notes,
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Transaction updated successfully",
      data: updatedTransaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating transaction",
      error: error.message,
    });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
     if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID format",
      });
    }
    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const deletedTransaction = await Transaction.findByIdAndDelete(id);
    if (!deletedTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction could not be deleted",
      });
    }
    res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting transaction",
      error: error.message,
    });
  }
};

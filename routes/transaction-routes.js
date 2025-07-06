import express from "express";
import {
  createTransaction,
  deleteTransaction,
  getAllTransactions,
  getRecentTransactions,
  getStats,
  updateTransaction,
} from "../controllers/transactionController.js";

const router = express.Router();

router.get("/", getAllTransactions);
router.get("/recent", getRecentTransactions);
router.get("/stats", getStats);
router.post("/", createTransaction);
router.post("/update/:id", updateTransaction);
router.post("/delete/:id", deleteTransaction);

export default router;

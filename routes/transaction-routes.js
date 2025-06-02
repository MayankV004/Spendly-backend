import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
  createTransaction,
  deleteTransaction,
  getAllTransactions,
  getRecentTransactions,
  getStats,
  updateTransaction,
} from "../controllers/transactionController.js";

const router = express.Router();

router.get("/", protectRoute, getAllTransactions);
router.get("/recent", protectRoute, getRecentTransactions);
router.get("/stats", protectRoute, getStats);
router.post("/", protectRoute, createTransaction);
router.put("/:id", protectRoute, updateTransaction);
router.post("/:id", protectRoute, deleteTransaction);

export default router;

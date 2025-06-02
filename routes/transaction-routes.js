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

import {
  validateQuery,
  validateBody,
  validateParams,
  getAllTransactionsQuerySchema,
  getRecentTransactionsQuerySchema,
  getStatsQuerySchema,
  createTransactionBodySchema,
  updateTransactionParamsSchema,
  updateTransactionBodySchema,
  deleteTransactionParamsSchema,
} from "../validation/transactionValidation.js";

const router = express.Router();

router.get(
  "/",
  protectRoute,
  validateQuery(getAllTransactionsQuerySchema),
  getAllTransactions
);

router.get(
  "/recent",
  protectRoute,
  
  getRecentTransactions
);

router.get(
  "/stats",
  protectRoute,

  getStats
);

router.post(
  "/",
  protectRoute,
  validateBody(createTransactionBodySchema),
  createTransaction
);

router.put(
  "/:id",
  protectRoute,
  validateParams(updateTransactionParamsSchema),
  validateBody(updateTransactionBodySchema),
  updateTransaction
);

router.delete(
  "/:id",
  protectRoute,
  validateParams(deleteTransactionParamsSchema),
  deleteTransaction
);

export default router;

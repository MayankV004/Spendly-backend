import { z } from "zod";

const objectIdSchema = z.string().min(24).max(24);
const transactionTypeSchema = z.enum(["income", "expense"]);
const sortBySchema = z.enum([
  "date",
  "amount",
  "description",
  "category",
  "type",
]);
const sortOrderSchema = z.enum(["asc", "desc"]);

export const getAllTransactionsQuerySchema = z.object({
  category: z.string().optional(),
  type: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().min(2).optional(),
  sortBy: sortBySchema.default("date"),
  sortOrder: sortOrderSchema.default("desc"),
});

export const getRecentTransactionsQuerySchema = z.object({
  limit: z
    .string()
    .transform((val) => parseInt(val) || 5)
    .refine((val) => val > 0 && val <= 50),
});

export const getStatsQuerySchema = z.object({
  month: z
    .string()
    .transform((val) => parseInt(val) || undefined)
    .optional(),
  year: z
    .string()
    .transform((val) => parseInt(val) || undefined)
    .optional(),
});

export const createTransactionBodySchema = z.object({
  description: z.string().min(1).max(200).trim(),
  amount: z.number().positive().max(999999999),
  type: transactionTypeSchema,
  category: z.string().min(1).max(50).trim(),
  date: z.string().optional(),
  notes: z.string().max(500).trim().optional().default(""),
});

export const updateTransactionParamsSchema = z.object({
  id: objectIdSchema,
});

export const updateTransactionBodySchema = z.object({
  description: z.string().min(1).max(200).trim().optional(),
  amount: z.number().positive().max(999999999).optional(),
  type: transactionTypeSchema.optional(),
  category: z.string().min(1).max(50).trim().optional(),
  date: z.string().optional(),
  notes: z.string().max(500).trim().optional(),
});

export const deleteTransactionParamsSchema = z.object({
  id: objectIdSchema,
});

export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      console.log(schema);
      req.query = schema.parse(req.query);
      
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: error.errors,
      });
    }
  };
};

export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body",
        errors: error.errors,
      });
    }
  };
};

export const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid parameters",
        errors: error.errors,
      });
    }
  };
};

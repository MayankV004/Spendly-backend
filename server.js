import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import authRoutes from "./routes/auth-routes.js";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import transactionRoutes from "./routes/transaction-routes.js";
import userRoutes from "./routes/user-routes.js";
dotenv.config();
const app = express();

connectDB();

const corsOptions = { 
  origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Allow-Origin",
    ],
    credentials: true,
    optionsSuccessStatus: 200
};
// Middleware
app.use(
  cors(corsOptions)
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  message: {
    success: false,
    message: "Too many authentication requests, please try again later.",
  },
});

app.use(limiter);

app.use(morgan("dev"));

// Routes
app.get("/", (req, res) => {
  res.send("Server is Running!!!");
});
app.use("/api/user", userRoutes);
app.use("/api/auth", authLimiter, authRoutes);
// app.options("/api/transactions/*", cors(corsOptions));
app.use("/api/transactions", cors(corsOptions), transactionRoutes);

// error handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global
app.use((error, req, res, next) => {
  console.error("Global error:", error);

  res.status(error.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong!"
        : error.message,
  });
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});

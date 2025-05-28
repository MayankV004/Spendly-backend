import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import authRoutes from "./routes/auth-routes.js";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

dotenv.config();
console.log("✅ Environment variables loaded");

const app = express();
console.log("✅ Express app initialized");

try {
  await connectDB();
  console.log("✅ Database connected successfully");
} catch (err) {
  console.error("❌ Database connection failed:", err);
}

app.use(express.json());
console.log("✅ express.json() middleware applied");

app.use(helmet());
console.log("✅ Helmet middleware applied");

app.use(express.urlencoded({ extended: true }));
console.log("✅ express.urlencoded() middleware applied");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use(limiter);
console.log("✅ Global rate limiter applied");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many authentication requests, please try again later.",
  },
});

app.use(morgan("dev"));
console.log("✅ Morgan logger applied");

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
  })
);
console.log("✅ CORS configured");

app.use(cookieParser());
console.log("✅ Cookie parser applied");

// Test route
app.get("/", (req, res) => {
  console.log("➡️ GET / hit");
  res.send("Server is Running!!!");
});

// Auth routes
console.log("⏳ Loading /api/auth routes...");
try {
  app.use("/api/auth", authLimiter, authRoutes);
  console.log("✅ Auth routes loaded");
} catch (err) {
  console.error("❌ Error loading auth routes:", err);
}

// Fallback 404 route
app.use((req, res) => {
  console.log(`⚠️ 404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("🔥 Global error handler:", error);
  res.status(error.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong!"
        : error.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

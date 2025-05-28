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
const app = express();

connectDB();

// Middleware
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs
    message: {
        success:false,
        message:"Too many requests, please try again later."}
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per windowMs 
    message: {
        success:false,
        message:"Too many authentication requests, please try again later."
    }
});

app.use(limiter);


app.use(morgan("dev"));
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true
}));
app.use(cookieParser());


// Routes
app.get('/', (req , res)=>{
    res.send("Server is Running!!!");
})
app.use('/api/auth', authLimiter, authRoutes)




// error handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : error.message
  });
});


app.listen(5000, ()=>{
    console.log("Server is running on port 5000");
})
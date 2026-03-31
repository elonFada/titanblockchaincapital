import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import userRoutes from './routes/userRoutes.js';
import registrationPaymentRoutes from './routes/registrationPaymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import depositRoutes from './routes/depositRoutes.js';
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;
const MONGO_URL = process.env.MONGO_URL;

// ✅ CORS MUST come first — before body parsers and routes
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'https://titanblockchaincapital.vercel.app',
  'https://titanblockchaincapital.com'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// ✅ Express 5 syntax
app.options('/{*path}', cors());

// Parse middleware (after CORS)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Backend is reachable" });
});

// Routes
app.use('/api/user', userRoutes);
app.use('/api/payment/registration', registrationPaymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/deposit', depositRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () =>
      console.log(`✅ Server running on port ${PORT}`)
    );
  })
  .catch((err) => console.error("❌ Mongo error:", err.message));
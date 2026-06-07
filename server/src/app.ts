import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

// Load .env — server/.env first, then root .env as fallback
dotenv.config({ path: path.resolve(__dirname, "../../server/.env") });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

import authRoutes from "./routes/auth";
import resultsRoutes from "./routes/results";
import leaderboardRoutes from "./routes/leaderboard";
import progressRoutes from "./routes/progress";

const app = express();

// --- CORS ---
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  // Vercel deployment URLs — set FRONTEND_URL env var for custom domain
  process.env.FRONTEND_URL,
  // Allow all *.vercel.app subdomains for preview deploys
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/progress", progressRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

export default app;

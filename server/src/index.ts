// Local development server — imports the Express app and starts listening.
// In production (Vercel), api/index.ts is used instead.
import app from "./app";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 TOEFL API Server running on http://localhost:${PORT}`);
  console.log(
    `📊 Database: ${process.env.DATABASE_URL?.split("@")[1] || "configured"}`
  );
});

export default app;

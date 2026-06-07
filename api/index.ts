/**
 * Vercel Serverless Function entry point.
 * This file exports the Express app so Vercel can wrap it as a serverless function.
 * All /api/* requests are routed here via vercel.json rewrites.
 */
import app from "../server/src/app";

export default app;

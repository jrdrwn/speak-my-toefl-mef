import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// GET /api/progress — get user progress and recent history
router.get("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const [progress, recentResults] = await Promise.all([
      prisma.userProgress.findUnique({ where: { userId } }),
      prisma.testResult.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          testType: true,
          score: true,
          rawCorrect: true,
          totalQs: true,
          xpEarned: true,
          createdAt: true,
        },
      }),
    ]);

    if (!progress) {
      // User has no progress yet (just registered)
      res.json({
        progress: {
          totalXp: 0,
          currentStreak: 0,
          longestStreak: 0,
          testsCount: 0,
          bestScore: 0,
          lastActiveAt: null,
        },
        recentResults: [],
      });
      return;
    }

    // Calculate XP level (every 500 XP = 1 level)
    const level = Math.floor(progress.totalXp / 500) + 1;
    const xpInCurrentLevel = progress.totalXp % 500;
    const xpToNextLevel = 500 - xpInCurrentLevel;

    res.json({
      progress: {
        totalXp: progress.totalXp,
        currentStreak: progress.currentStreak,
        longestStreak: progress.longestStreak,
        testsCount: progress.testsCount,
        bestScore: progress.bestScore,
        lastActiveAt: progress.lastActiveAt,
        level,
        xpInCurrentLevel,
        xpToNextLevel,
      },
      recentResults,
    });
  } catch (err) {
    console.error("Progress error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// XP calculation
function calculateXp(testType: string, score: number, totalQs: number, rawCorrect: number): number {
  let xp = 0;

  if (testType === "full") {
    xp += 200; // base XP for completing full test
    if (score >= 500) xp += 100; // bonus for high score
    if (score >= 600) xp += 100; // bonus for excellent score
  } else {
    xp += 75; // base XP for completing a section
  }

  // Perfect score bonus
  if (rawCorrect === totalQs) xp += 50;

  return xp;
}

// Streak update logic
async function updateStreak(userId: string): Promise<{ streakBonus: number; newStreak: number }> {
  const progress = await prisma.userProgress.findUnique({ where: { userId } });
  if (!progress) return { streakBonus: 0, newStreak: 1 };

  const now = new Date();
  const last = progress.lastActiveAt;
  const nowDay = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
  const lastDay = Math.floor(last.getTime() / (1000 * 60 * 60 * 24));

  let newStreak = progress.currentStreak;
  let streakBonus = 0;

  if (lastDay === nowDay) {
    // Already active today, no streak change
  } else if (lastDay === nowDay - 1) {
    // Consecutive day
    newStreak += 1;
    streakBonus = 25; // streak bonus XP
  } else {
    // Streak broken
    newStreak = 1;
  }

  return { streakBonus, newStreak };
}

const resultSchema = z.object({
  testType: z.enum(["full", "listening", "structure", "reading"]),
  score: z.number().int().min(0),
  rawCorrect: z.number().int().min(0),
  totalQs: z.number().int().min(1),
  lScore: z.number().int().optional(),
  sScore: z.number().int().optional(),
  rScore: z.number().int().optional(),
});

// POST /api/results — save test result
router.post("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = resultSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.errors[0].message });
      return;
    }

    const { testType, score, rawCorrect, totalQs, lScore, sScore, rScore } = body.data;
    const userId = req.userId!;

    const xpEarned = calculateXp(testType, score, totalQs, rawCorrect);
    const { streakBonus, newStreak } = await updateStreak(userId);
    const totalXpGained = xpEarned + streakBonus;

    // Save test result
    const result = await prisma.testResult.create({
      data: {
        userId,
        testType,
        score,
        rawCorrect,
        totalQs,
        lScore,
        sScore,
        rScore,
        xpEarned: totalXpGained,
      },
    });

    // Update or create user progress
    const existingProgress = await prisma.userProgress.findUnique({ where: { userId } });

    const newBestScore =
      testType === "full"
        ? Math.max(existingProgress?.bestScore ?? 0, score)
        : existingProgress?.bestScore ?? 0;

    await prisma.userProgress.upsert({
      where: { userId },
      create: {
        userId,
        totalXp: totalXpGained,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveAt: new Date(),
        testsCount: 1,
        bestScore: testType === "full" ? score : 0,
      },
      update: {
        totalXp: { increment: totalXpGained },
        currentStreak: newStreak,
        longestStreak: Math.max(existingProgress?.longestStreak ?? 0, newStreak),
        lastActiveAt: new Date(),
        testsCount: { increment: 1 },
        bestScore: newBestScore,
      },
    });

    res.status(201).json({
      result,
      xpEarned: totalXpGained,
      streakBonus,
      newStreak,
    });
  } catch (err) {
    console.error("Save result error:", err);
    res.status(500).json({ error: "Server error saat menyimpan hasil" });
  }
});

// GET /api/results — get user test history
router.get("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const results = await prisma.testResult.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    res.json({ results });
  } catch (err) {
    console.error("Get results error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

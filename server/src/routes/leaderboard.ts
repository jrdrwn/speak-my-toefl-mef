import { Router, Request, Response } from "express";
import { PrismaClient, UserProgress, User } from "@prisma/client";
import { authMiddleware, AuthRequest } from "../middleware/auth";

type ProgressWithUser = UserProgress & { user: Pick<User, "name" | "email"> };


const router = Router();
const prisma = new PrismaClient();

// GET /api/leaderboard — top users by best full test score
// All users with any activity are shown; those without full test show bestScore = 0
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    // Fetch all users with progress data
    const allProgress = await prisma.userProgress.findMany({
      orderBy: [
        { bestScore: "desc" },
        { totalXp: "desc" },
        { testsCount: "desc" },
      ],
      take: 20,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    const leaderboard = allProgress.map((entry: ProgressWithUser, idx: number) => ({
      rank: idx + 1,
      name: entry.user.name,
      email: entry.user.email,
      bestScore: entry.bestScore,
      totalXp: entry.totalXp,
      testsCount: entry.testsCount,
      currentStreak: entry.currentStreak,
      hasFullTest: entry.bestScore > 0,
    }));

    res.json({ leaderboard });
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/leaderboard/me — get current user's rank among all users
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allProgress = await prisma.userProgress.findMany({
      orderBy: [
        { bestScore: "desc" },
        { totalXp: "desc" },
        { testsCount: "desc" },
      ],
    });

    const myIndex = allProgress.findIndex((p: UserProgress) => p.userId === req.userId);

    res.json({
      rank: myIndex >= 0 ? myIndex + 1 : null,
      total: allProgress.length,
    });
  } catch (err) {
    console.error("My rank error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

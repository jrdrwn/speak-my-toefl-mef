import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "toefl-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  name: z.string().min(2, "Nama minimal 2 karakter").max(50),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = registerSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.errors[0].message });
      return;
    }

    const { email, name, password } = body.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email sudah terdaftar" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        userProgress: {
          create: {
            totalXp: 0,
            currentStreak: 0,
            longestStreak: 0,
            testsCount: 0,
            bestScore: 0,
          },
        },
      },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error saat register" });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Email atau password tidak valid" });
      return;
    }

    const { email, password } = body.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Email atau password salah" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ error: "Email atau password salah" });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error saat login" });
  }
});

// GET /api/auth/me — get current user info
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ error: "User tidak ditemukan" });
      return;
    }
    res.json({ user });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

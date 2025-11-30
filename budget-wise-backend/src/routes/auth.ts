import { Router } from "express";
import { pool } from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const router = Router();

const JWT_EXPIRES_IN = "7d";

function createToken(userId: number) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return jwt.sign({ userId }, secret, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * POST /api/auth/register
 * body: { name, email, password }
 */
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "name, email, password are required" });
  }

  try {
    const [existing] = await pool.execute(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );
    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password_hash)
       VALUES (?, ?, ?)`,
      [name, email, passwordHash]
    );
    const userId = (result as any).insertId;

    const token = createToken(userId);

    const user = { userId, name, email };
    res.status(201).json({ user, token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Failed to register" });
  }
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "email, password are required" });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT user_id, name, email, password_hash
       FROM users WHERE email = ?`,
      [email]
    );
    const rowArray = rows as any[];
    if (rowArray.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const userRow = rowArray[0];
    const ok = await bcrypt.compare(password, userRow.password_hash);
    if (!ok) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = createToken(userRow.user_id);
    const user = {
      userId: userRow.user_id,
      name: userRow.name,
      email: userRow.email,
    };

    res.json({ user, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

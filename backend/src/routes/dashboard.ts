import { Router, Response } from "express";
import { authenticate } from "../middleware/auth";
import { AuthRequest } from "../types";
import { getDashboardStats } from "../services/tasks";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await getDashboardStats(req.user!.userId, req.user!.role);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

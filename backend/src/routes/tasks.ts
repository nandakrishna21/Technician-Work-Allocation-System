import { Router, Response } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { AuthRequest } from "../types";
import {
  createTask,
  getTasks,
  getTaskById,
  assignTask,
  acceptTask,
  requestClarification,
  startProgress,
  updateProgress,
  completeTask,
  reviewTask,
  editTask,
} from "../services/tasks";

const router = Router();

router.post("/", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response) => {
  try {
    const task = await createTask({
      ...req.body,
      createdById: req.user!.userId,
    });
    res.status(201).json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, clientName, priority, dateFrom, dateTo } = req.query;
    const tasks = await getTasks({
      status: status as string | undefined,
      clientName: clientName as string | undefined,
      priority: priority as string | undefined,
      dateFrom: dateFrom as string | undefined,
      dateTo: dateTo as string | undefined,
      userId: req.user!.userId,
      role: req.user!.role,
    });
    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const task = await getTaskById(Number(req.params.id));
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response) => {
  try {
    const task = await editTask(Number(req.params.id), req.user!.userId, req.body);
    res.json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/assign", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response) => {
  try {
    const { userIds, leadUserId } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ error: "At least one technician must be assigned" });
      return;
    }
    const task = await assignTask(
      Number(req.params.id),
      userIds,
      leadUserId || null,
      req.user!.userId
    );
    res.json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/accept", authenticate, authorize("TECHNICIAN"), async (req: AuthRequest, res: Response) => {
  try {
    const result = await acceptTask(Number(req.params.id), req.user!.userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/clarification", authenticate, authorize("TECHNICIAN"), async (req: AuthRequest, res: Response) => {
  try {
    const { notes } = req.body;
    if (!notes) {
      res.status(400).json({ error: "Notes are required" });
      return;
    }
    const result = await requestClarification(Number(req.params.id), req.user!.userId, notes);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/start", authenticate, authorize("TECHNICIAN"), async (req: AuthRequest, res: Response) => {
  try {
    const result = await startProgress(Number(req.params.id), req.user!.userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/progress", authenticate, authorize("TECHNICIAN"), async (req: AuthRequest, res: Response) => {
  try {
    const result = await updateProgress(Number(req.params.id), req.user!.userId, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/complete", authenticate, authorize("TECHNICIAN"), async (req: AuthRequest, res: Response) => {
  try {
    const { notes } = req.body;
    if (!notes) {
      res.status(400).json({ error: "Completion notes are required" });
      return;
    }
    const task = await completeTask(Number(req.params.id), req.user!.userId, req.body);
    res.json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/review", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response) => {
  try {
    const { approved, reason } = req.body;
    if (approved === undefined) {
      res.status(400).json({ error: "Approval decision is required" });
      return;
    }
    const task = await reviewTask(Number(req.params.id), req.user!.userId, approved, reason);
    res.json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

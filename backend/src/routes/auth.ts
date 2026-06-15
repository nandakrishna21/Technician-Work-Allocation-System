import { Router, Response } from "express";
import { loginUser, getUsers, createUser } from "../services/auth";
import { authenticate, authorize } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

router.post("/login", async (req, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }
    const result = await loginUser(username, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

router.get("/users", authenticate, authorize("ADMIN"), async (_req, res: Response) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/users", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, name, role, phone, email } = req.body;
    if (!username || !password || !name || !role) {
      res.status(400).json({ error: "Username, password, name, and role are required" });
      return;
    }
    if (!["ADMIN", "TECHNICIAN"].includes(role)) {
      res.status(400).json({ error: "Role must be ADMIN or TECHNICIAN" });
      return;
    }
    const user = await createUser({ username, password, name, role, phone, email });
    res.status(201).json(user);
  } catch (err: any) {
    if (err.code === "P2002") {
      res.status(400).json({ error: "Username already exists" });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;

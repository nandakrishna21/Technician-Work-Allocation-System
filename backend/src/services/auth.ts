import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-production-2024";

export async function loginUser(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.active) {
    throw new Error("Invalid credentials");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, username: user.username },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  };
}

export async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      phone: true,
      email: true,
      active: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function createUser(data: {
  username: string;
  password: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
}) {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: {
      username: data.username,
      password: hashedPassword,
      name: data.name,
      role: data.role,
      phone: data.phone,
      email: data.email,
    },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      phone: true,
      email: true,
      active: true,
      createdAt: true,
    },
  });
}

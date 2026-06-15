import { Request } from "express";

export interface JwtPayload {
  userId: number;
  role: string;
  username: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const TASK_STATUSES = {
  CREATED: "CREATED",
  ASSIGNED: "ASSIGNED",
  ACCEPTED: "ACCEPTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CLOSED: "CLOSED",
} as const;

export type TaskStatus = (typeof TASK_STATUSES)[keyof typeof TASK_STATUSES];

export const PRIORITIES = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
} as const;

export type Priority = (typeof PRIORITIES)[keyof typeof PRIORITIES];

export const ROLES = {
  ADMIN: "ADMIN",
  TECHNICIAN: "TECHNICIAN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

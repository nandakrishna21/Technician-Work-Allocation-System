export interface User {
  id: number;
  username: string;
  name: string;
  role: "ADMIN" | "TECHNICIAN";
  phone?: string;
  email?: string;
  active: boolean;
  createdAt: string;
}

export interface TaskAssignment {
  id: number;
  taskId: number;
  userId: number;
  isLead: boolean;
  assignedAt: string;
  acceptedAt: string | null;
  status: string;
  user: Pick<User, "id" | "name" | "username" | "role">;
}

export interface TaskPhoto {
  id: number;
  taskId: number;
  filename: string;
  path: string;
  type: string;
  uploadedAt: string;
}

export interface ActivityLogEntry {
  id: number;
  taskId: number;
  userId: number;
  action: string;
  details: string | null;
  createdAt: string;
  user: Pick<User, "id" | "name" | "role">;
}

export interface Task {
  id: number;
  taskId: string;
  clientName: string;
  contactPerson: string | null;
  mobileNumber: string | null;
  location: string | null;
  jobType: string;
  description: string | null;
  specialInstructions: string | null;
  priority: "High" | "Medium" | "Low";
  attachment: string | null;
  status: string;
  createdById: number;
  assignedById: number | null;
  completedNotes: string | null;
  completedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: Pick<User, "id" | "name" | "username">;
  assignedBy: Pick<User, "id" | "name" | "username"> | null;
  assignments: TaskAssignment[];
  photos: TaskPhoto[];
  activityLogs: ActivityLogEntry[];
}

export interface DashboardStats {
  openTasks: number;
  assignedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  closedTasks: number;
  total: number;
}

export const STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-gray-100 text-gray-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-purple-100 text-purple-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-800 text-white",
};

export const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-red-100 text-red-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Low: "bg-green-100 text-green-800",
};

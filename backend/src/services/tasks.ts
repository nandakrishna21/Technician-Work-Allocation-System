import { PrismaClient, Prisma } from "@prisma/client";
import { logActivity } from "./activityLog";

const prisma = new PrismaClient();

function generateTaskId(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TASK-${year}-${random}`;
}

const taskInclude = {
  createdBy: { select: { id: true, name: true, username: true } },
  assignedBy: { select: { id: true, name: true, username: true } },
  assignments: {
    include: {
      user: { select: { id: true, name: true, username: true, role: true } },
    },
  },
  photos: true,
  activityLogs: {
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

export async function createTask(data: {
  clientName: string;
  contactPerson?: string;
  mobileNumber?: string;
  location?: string;
  jobType: string;
  description?: string;
  specialInstructions?: string;
  priority: string;
  attachment?: string;
  createdById: number;
}) {
  const task = await prisma.task.create({
    data: {
      taskId: generateTaskId(),
      clientName: data.clientName,
      contactPerson: data.contactPerson,
      mobileNumber: data.mobileNumber,
      location: data.location,
      jobType: data.jobType,
      description: data.description,
      specialInstructions: data.specialInstructions,
      priority: data.priority,
      attachment: data.attachment,
      status: "CREATED",
      createdById: data.createdById,
    },
    include: taskInclude,
  });

  await logActivity(task.id, data.createdById, "TASK_CREATED", `Task ${task.taskId} created`);

  return task;
}

export async function getTasks(filters?: {
  status?: string;
  userId?: number;
  role?: string;
  clientName?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const where: Prisma.TaskWhereInput = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.clientName) {
    where.clientName = { contains: filters.clientName };
  }

  if (filters?.priority) {
    where.priority = filters.priority;
  }

  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      where.createdAt.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.createdAt.lte = new Date(filters.dateTo);
    }
  }

  if (filters?.userId && filters?.role === "TECHNICIAN") {
    where.assignments = { some: { userId: filters.userId } };
  }

  return prisma.task.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true, username: true } },
      assignedBy: { select: { id: true, name: true, username: true } },
      assignments: {
        include: {
          user: { select: { id: true, name: true, username: true, role: true } },
        },
      },
      photos: true,
      _count: { select: { activityLogs: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTaskById(taskId: number) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: taskInclude,
  });
}

export async function assignTask(
  taskId: number,
  userIds: number[],
  leadUserId: number | null,
  assignedById: number
) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");
  if (task.status !== "CREATED" && task.status !== "ASSIGNED") {
    throw new Error("Task can only be assigned when in CREATED or ASSIGNED status");
  }

  await prisma.taskAssignment.deleteMany({ where: { taskId } });

  for (const userId of userIds) {
    await prisma.taskAssignment.create({
      data: {
        taskId,
        userId,
        isLead: userId === leadUserId,
        status: "ASSIGNED",
      },
    });
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "ASSIGNED",
      assignedById,
    },
    include: taskInclude,
  });

  const userNames = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { name: true },
  });

  await logActivity(
    taskId,
    assignedById,
    "TASK_ASSIGNED",
    `Assigned to: ${userNames.map((u) => u.name).join(", ")}`
  );

  return updated;
}

export async function acceptTask(taskId: number, userId: number) {
  const assignment = await prisma.taskAssignment.findUnique({
    where: { taskId_userId: { taskId, userId } },
  });
  if (!assignment) throw new Error("Not assigned to this task");

  const updated = await prisma.taskAssignment.update({
    where: { taskId_userId: { taskId, userId } },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  const allAssignments = await prisma.taskAssignment.findMany({
    where: { taskId },
  });

  if (allAssignments.every((a) => a.status === "ACCEPTED")) {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "ACCEPTED" },
    });
  }

  await logActivity(taskId, userId, "TASK_ACCEPTED", "Technician accepted the task");

  return updated;
}

export async function requestClarification(taskId: number, userId: number, notes: string) {
  const assignment = await prisma.taskAssignment.findUnique({
    where: { taskId_userId: { taskId, userId } },
  });
  if (!assignment) throw new Error("Not assigned to this task");

  await logActivity(taskId, userId, "CLARIFICATION_REQUESTED", notes);

  return { message: "Clarification requested" };
}

export async function startProgress(taskId: number, userId: number) {
  const assignment = await prisma.taskAssignment.findUnique({
    where: { taskId_userId: { taskId, userId } },
  });
  if (!assignment) throw new Error("Not assigned to this task");

  await prisma.taskAssignment.update({
    where: { taskId_userId: { taskId, userId } },
    data: { status: "IN_PROGRESS" },
  });

  await prisma.task.update({
    where: { id: taskId },
    data: { status: "IN_PROGRESS" },
  });

  await logActivity(taskId, userId, "WORK_STARTED", "Technician started work");

  return { message: "Work started" };
}

export async function updateProgress(
  taskId: number,
  userId: number,
  data: { notes?: string; photos?: string[] }
) {
  const assignment = await prisma.taskAssignment.findUnique({
    where: { taskId_userId: { taskId, userId } },
  });
  if (!assignment) throw new Error("Not assigned to this task");

  if (data.notes) {
    await logActivity(taskId, userId, "PROGRESS_UPDATE", data.notes);
  }

  if (data.photos) {
    for (const photo of data.photos) {
      await prisma.taskPhoto.create({
        data: { taskId, filename: photo, path: photo, type: "PROGRESS" },
      });
    }
  }

  return { message: "Progress updated" };
}

export async function completeTask(
  taskId: number,
  userId: number,
  data: { notes: string; photos?: string[] }
) {
  const assignment = await prisma.taskAssignment.findUnique({
    where: { taskId_userId: { taskId, userId } },
  });
  if (!assignment) throw new Error("Not assigned to this task");

  if (data.photos) {
    for (const photo of data.photos) {
      await prisma.taskPhoto.create({
        data: { taskId, filename: photo, path: photo, type: "COMPLETION" },
      });
    }
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "COMPLETED",
      completedNotes: data.notes,
      completedAt: new Date(),
    },
  });

  await logActivity(taskId, userId, "TASK_COMPLETED", data.notes);

  return prisma.task.findUnique({
    where: { id: taskId },
    include: taskInclude,
  });
}

export async function reviewTask(taskId: number, userId: number, approved: boolean, reason?: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");
  if (task.status !== "COMPLETED") throw new Error("Task must be COMPLETED before review");

  if (approved) {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
      },
    });
    await logActivity(taskId, userId, "TASK_CLOSED", "Admin approved and closed the task");
  } else {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "IN_PROGRESS" },
    });
    await logActivity(taskId, userId, "TASK_REOPENED", reason || "Admin reopened the task");
  }

  return prisma.task.findUnique({
    where: { id: taskId },
    include: taskInclude,
  });
}

export async function editTask(
  taskId: number,
  userId: number,
  data: Partial<{
    clientName: string;
    contactPerson: string;
    mobileNumber: string;
    location: string;
    jobType: string;
    description: string;
    specialInstructions: string;
    priority: string;
  }>
) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");

  const updated = await prisma.task.update({
    where: { id: taskId },
    data,
    include: taskInclude,
  });

  await logActivity(taskId, userId, "TASK_EDITED", "Task details updated");

  return updated;
}

export async function getDashboardStats(userId?: number, role?: string) {
  const whereBase: Prisma.TaskWhereInput = {};
  if (userId && role === "TECHNICIAN") {
    whereBase.assignments = { some: { userId } };
  }

  const [openTasks, assignedTasks, inProgressTasks, completedTasks, closedTasks] =
    await Promise.all([
      prisma.task.count({ where: { ...whereBase, status: "CREATED" } }),
      prisma.task.count({ where: { ...whereBase, status: "ASSIGNED" } }),
      prisma.task.count({ where: { ...whereBase, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { ...whereBase, status: "COMPLETED" } }),
      prisma.task.count({ where: { ...whereBase, status: "CLOSED" } }),
    ]);

  return {
    openTasks,
    assignedTasks,
    inProgressTasks,
    completedTasks,
    closedTasks,
    total: openTasks + assignedTasks + inProgressTasks + completedTasks + closedTasks,
  };
}

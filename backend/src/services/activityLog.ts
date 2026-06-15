import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function logActivity(
  taskId: number,
  userId: number,
  action: string,
  details?: string
): Promise<void> {
  await prisma.activityLog.create({
    data: { taskId, userId, action, details },
  });
}

export async function getActivityLog(taskId: number) {
  return prisma.activityLog.findMany({
    where: { taskId },
    include: { user: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });
}

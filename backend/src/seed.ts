import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  const techPassword = await bcrypt.hash("tech123", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      name: "System Admin",
      role: "ADMIN",
    },
  });

  const tech1 = await prisma.user.upsert({
    where: { username: "tech1" },
    update: {},
    create: {
      username: "tech1",
      password: techPassword,
      name: "John Technician",
      role: "TECHNICIAN",
      phone: "555-0101",
    },
  });

  const tech2 = await prisma.user.upsert({
    where: { username: "tech2" },
    update: {},
    create: {
      username: "tech2",
      password: techPassword,
      name: "Jane Technician",
      role: "TECHNICIAN",
      phone: "555-0102",
    },
  });

  console.log("Users created:");
  console.log(`  Admin: admin / admin123`);
  console.log(`  Technician 1: tech1 / tech123`);
  console.log(`  Technician 2: tech2 / tech123`);

  const sampleTask = await prisma.task.upsert({
    where: { taskId: "TASK-2024-SAMPLE" },
    update: {},
    create: {
      taskId: "TASK-2024-SAMPLE",
      clientName: "ABC Corporation",
      contactPerson: "Mr. Smith",
      mobileNumber: "555-0200",
      location: "123 Main Street, Suite 100",
      jobType: "Installation",
      description: "Install new network equipment",
      specialInstructions: "Call 30 minutes before arrival",
      priority: "High",
      status: "CREATED",
      createdById: admin.id,
    },
  });

  console.log(`  Sample task: ${sampleTask.taskId}`);

  console.log("\nSeed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

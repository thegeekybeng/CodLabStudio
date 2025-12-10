
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const executions = await prisma.execution.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      status: true,
      guestId: true
    }
  });
  console.log(JSON.stringify(executions, null, 2));
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });

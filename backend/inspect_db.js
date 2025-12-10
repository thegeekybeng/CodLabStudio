
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const executions = await prisma.execution.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
  });
  console.log(JSON.stringify(executions, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

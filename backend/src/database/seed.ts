import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@codlabstudio.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@CodLabStudio2024!';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Hash admin password
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash,
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin user created successfully');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Role: ${admin.role}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default admin password after first login!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('✅ Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}

export default seed;


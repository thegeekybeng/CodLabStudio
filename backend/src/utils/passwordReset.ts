import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

/**
 * Reset admin password to default
 * Useful for troubleshooting login issues
 */
export async function resetAdminPassword(): Promise<void> {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@universalnotebook.local';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@UniversalNotebook2024!';

  try {
    const admin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (!admin) {
      throw new Error('Admin user not found');
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash },
    });

    console.log('✅ Admin password reset successfully');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Verify admin password matches
 */
export async function verifyAdminPassword(): Promise<boolean> {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@universalnotebook.local';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@UniversalNotebook2024!';

  try {
    const admin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (!admin) {
      return false;
    }

    const isValid = await bcrypt.compare(ADMIN_PASSWORD, admin.passwordHash);
    return isValid;
  } catch (error) {
    console.error('Error verifying admin password:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}


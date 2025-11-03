/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  const password = crypto.randomBytes(12).toString('base64url');
  const hashedPassword = await bcrypt.hash(password, 10);

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: new Date(),
        hashedPassword
      }
    });
    console.log(`Updated existing admin user: ${adminEmail}`);
  } else {
    await prisma.user.create({
      data: {
        email: adminEmail,
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: new Date(),
        dailyLimit: 1000,
        hashedPassword
      }
    });
    console.log(`Created admin user: ${adminEmail}`);
  }

  console.log('\nAdmin credentials:');
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Password: ${password}`);
  console.log('\nStore this password securely. You can change it after logging in.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

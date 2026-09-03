import { PrismaClient, UserRole, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const defaultAdminEmail = 'admin@jerryfitness.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: defaultAdminEmail },
  });

  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        email: defaultAdminEmail,
        // Mock hashed password for seed baseline
        passwordHash: '$2b$10$EpRnTzVlqHNP0.fKbX25y.90gQ8lJqf/5341xQJv4/05k2N3.qf2W',
        firstName: 'System',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`Created admin user with ID: ${admin.id}`);
  } else {
    console.log('Admin user already exists.');
  }

  const sampleMemberEmail = 'member@jerryfitness.com';
  const existingMember = await prisma.user.findUnique({
    where: { email: sampleMemberEmail },
  });

  if (!existingMember) {
    const member = await prisma.user.create({
      data: {
        email: sampleMemberEmail,
        passwordHash: '$2b$10$EpRnTzVlqHNP0.fKbX25y.90gQ8lJqf/5341xQJv4/05k2N3.qf2W',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.MEMBER,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`Created sample member user with ID: ${member.id}`);
  } else {
    console.log('Sample member user already exists.');
  }

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

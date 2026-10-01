import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = 'Password123!';
const EMPLOYEE_COUNT = 4;
const LICENSED_EMPLOYEE_COUNT = 2;

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const company =
    (await prisma.company.findFirst({ where: { name: 'Acme Corp' } })) ??
    (await prisma.company.create({
      data: { name: 'Acme Corp', licenseLimit: 5, usageLimit: 1000 },
    }));

  const adminEmail = 'admin@acme.test';
  const admin =
    (await prisma.user.findUnique({ where: { email: adminEmail } })) ??
    (await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: 'ADMIN', companyId: company.id },
    }));

  const employees = [];
  for (let i = 1; i <= EMPLOYEE_COUNT; i++) {
    const email = `employee${i}@acme.test`;
    const employee =
      (await prisma.user.findUnique({ where: { email } })) ??
      (await prisma.user.create({
        data: { email, passwordHash, role: 'USER', companyId: company.id },
      }));
    employees.push(employee);
  }

  for (const employee of employees.slice(0, LICENSED_EMPLOYEE_COUNT)) {
    const existingLicense = await prisma.license.findUnique({ where: { userId: employee.id } });
    if (!existingLicense) {
      await prisma.license.create({
        data: { userId: employee.id, companyId: company.id, status: 'ACTIVE' },
      });
    }
  }

  const usageCount = await prisma.apiUsageRecord.count({ where: { companyId: company.id } });
  if (usageCount === 0) {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    await prisma.apiUsageRecord.createMany({
      data: Array.from({ length: 10 }, (_, i) => ({
        companyId: company.id,
        count: Math.floor(Math.random() * 60) + 10,
        recordedAt: new Date(now - i * dayMs),
      })),
    });
  }

  console.log('Seed complete:');
  console.log(`  Company: ${company.name} (${company.id})`);
  console.log(`  Admin login: ${admin.email} / ${DEMO_PASSWORD}`);
  console.log(`  Employees: ${employees.map((e) => e.email).join(', ')} (password: ${DEMO_PASSWORD})`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });

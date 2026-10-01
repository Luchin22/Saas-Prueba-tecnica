import { ValidationPipe, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Role } from '../../src/common/enums/role.enum';

export const E2E_PASSWORD = 'Password123!';

export type TestCompanyFixture = {
  companyId: string;
  adminId: string;
  adminEmail: string;
  employeeId: string;
  employeeEmail: string;
};

export async function createTestApp(): Promise<{ app: INestApplication; prisma: PrismaService }> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();
  const prisma = app.get(PrismaService);
  return { app, prisma };
}

export async function seedTestCompany(
  prisma: PrismaService,
  overrides: { licenseLimit?: number; usageLimit?: number } = {},
): Promise<TestCompanyFixture> {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  const passwordHash = await bcrypt.hash(E2E_PASSWORD, 4);

  const company = await prisma.company.create({
    data: {
      name: `E2E Test Co ${suffix}`,
      licenseLimit: overrides.licenseLimit ?? 2,
      usageLimit: overrides.usageLimit ?? 1000,
    },
  });

  const adminEmail = `admin-${suffix}@e2e.test`;
  const admin = await prisma.user.create({
    data: { email: adminEmail, passwordHash, role: Role.ADMIN, companyId: company.id },
  });

  const employeeEmail = `employee-${suffix}@e2e.test`;
  const employee = await prisma.user.create({
    data: { email: employeeEmail, passwordHash, role: Role.USER, companyId: company.id },
  });

  return {
    companyId: company.id,
    adminId: admin.id,
    adminEmail,
    employeeId: employee.id,
    employeeEmail,
  };
}

export async function cleanupTestCompany(prisma: PrismaService, companyId: string): Promise<void> {
  await prisma.apiUsageRecord.deleteMany({ where: { companyId } });
  await prisma.license.deleteMany({ where: { companyId } });
  await prisma.user.deleteMany({ where: { companyId } });
  await prisma.company.deleteMany({ where: { id: companyId } });
}

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ILicensesRepository } from '../domain/licenses.repository.interface';
import { AssignLicenseResult, LicenseEntity } from '../domain/license.entity';

@Injectable()
export class LicensesPrismaRepository implements ILicensesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyActiveByCompany(companyId: string): Promise<LicenseEntity[]> {
    const licenses = await this.prisma.license.findMany({
      where: { companyId, status: 'ACTIVE' },
      orderBy: { assignedAt: 'desc' },
    });
    return licenses.map((license) => this.toEntity(license));
  }

  async assignWithinLimit(
    userId: string,
    companyId: string,
    licenseLimit: number,
  ): Promise<AssignLicenseResult> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const existing = await tx.license.findUnique({ where: { userId } });

          if (existing && existing.status === 'ACTIVE') {
            return { outcome: 'already_active' } as const;
          }

          const activeCount = await tx.license.count({ where: { companyId, status: 'ACTIVE' } });
          if (activeCount >= licenseLimit) {
            return { outcome: 'limit_exceeded' } as const;
          }

          const license = existing
            ? await tx.license.update({
                where: { userId },
                data: { status: 'ACTIVE', assignedAt: new Date(), revokedAt: null },
              })
            : await tx.license.create({ data: { userId, companyId, status: 'ACTIVE' } });

          return { outcome: 'assigned', license: this.toEntity(license) } as const;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      // A serialization failure means another concurrent assignment raced us for the
      // last available slot; treat it the same as "limit reached" rather than a 500.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        return { outcome: 'limit_exceeded' } as const;
      }
      throw error;
    }
  }

  private toEntity(license: {
    id: string;
    userId: string;
    companyId: string;
    status: string;
    assignedAt: Date;
    revokedAt: Date | null;
  }): LicenseEntity {
    return {
      id: license.id,
      userId: license.userId,
      companyId: license.companyId,
      status: license.status as LicenseEntity['status'],
      assignedAt: license.assignedAt,
      revokedAt: license.revokedAt,
    };
  }
}

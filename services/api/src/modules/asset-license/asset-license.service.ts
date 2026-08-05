import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { 
  CreateAssetLicenseDto, 
  UpdateAssetLicenseDto, 
  GrantLicenseDto,
  AssetLicenseStatus,
  AssetLicenseType 
} from './dto/asset-license.dto';

@Injectable()
export class AssetLicenseService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationService: NotificationService,
  ) {}

  async getUserLicenses(telegramUserId: string) {
    return this.prisma.userAssetLicense.findMany({
      where: { telegramUserId: BigInt(telegramUserId) },
      include: {
        user: {
          select: {
            telegramUserId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserLicense(telegramUserId: string, asset: string) {
    const license = await this.prisma.userAssetLicense.findUnique({
      where: {
        telegramUserId_asset: {
          telegramUserId: BigInt(telegramUserId),
          asset,
        },
      },
    });

    if (!license) {
      throw new NotFoundException(`License for asset ${asset} not found`);
    }

    return license;
  }

  async createLicense(telegramUserId: string, dto: CreateAssetLicenseDto, adminId: string) {
    // Check if license already exists
    const existing = await this.prisma.userAssetLicense.findUnique({
      where: {
        telegramUserId_asset: {
          telegramUserId: BigInt(telegramUserId),
          asset: dto.asset,
        },
      },
    });

    if (existing) {
      throw new ForbiddenException(`License for asset ${dto.asset} already exists`);
    }

    const license = await this.prisma.userAssetLicense.create({
      data: {
        telegramUserId: BigInt(telegramUserId),
        asset: dto.asset,
        status: AssetLicenseStatus.ACTIVE,
        licenseType: dto.licenseType,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        grantedBy: adminId,
        purchaseTransactionId: dto.purchaseTransactionId,
        metadata: dto.metadata || {},
      },
    });

    // Audit log
    await this.auditService.create({
      eventType: 'LICENSE_GRANTED' as any,
      telegramUserId: BigInt(telegramUserId),
      description: `License granted for asset ${dto.asset}`,
      metadata: {
        asset: dto.asset,
        licenseType: dto.licenseType,
        licenseId: license.id,
        adminId,
      },
    });

    // Send notification
    await this.notificationService.createNotification({
      telegramUserId: BigInt(telegramUserId),
      type: 'LICENSE_GRANTED',
      title: `${dto.asset} License Granted`,
      message: `You now have access to ${dto.asset} mining output.`,
      metadata: { asset: dto.asset, licenseId: license.id },
    } as any);

    return license;
  }

  async updateLicense(licenseId: string, dto: UpdateAssetLicenseDto, adminId: string) {
    const existing = await this.prisma.userAssetLicense.findUnique({
      where: { id: licenseId },
    });

    if (!existing) {
      throw new NotFoundException('License not found');
    }

    const previousStatus = existing.status;

    const license = await this.prisma.userAssetLicense.update({
      where: { id: licenseId },
      data: {
        status: dto.status,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        metadata: dto.metadata || {},
      },
    });

    // Audit log
    await this.auditService.create({
      eventType: 'LICENSE_UPDATED' as any,
      telegramUserId: existing.telegramUserId,
      description: `License updated for asset ${existing.asset}`,
      metadata: {
        asset: existing.asset,
        previousStatus,
        newStatus: dto.status,
        licenseId,
        reason: dto.reason,
        adminId,
      },
    });

    // Send notification for status changes
    if (previousStatus !== dto.status) {
      let title = '';
      let message = '';

      switch (dto.status) {
        case AssetLicenseStatus.SUSPENDED:
          title = `${existing.asset} License Suspended`;
          message = `Your ${existing.asset} mining output has been temporarily paused.`;
          break;
        case AssetLicenseStatus.REVOKED:
          title = `${existing.asset} License Revoked`;
          message = `Your ${existing.asset} mining output access has been revoked.`;
          break;
        case AssetLicenseStatus.ACTIVE:
          title = `${existing.asset} License Reactivated`;
          message = `Your ${existing.asset} mining output access has been restored.`;
          break;
      }

      if (title && message) {
        await this.notificationService.createNotification({
          telegramUserId: existing.telegramUserId,
          type: 'LICENSE_STATUS_CHANGED',
          title,
          message,
          metadata: { asset: existing.asset, licenseId, newStatus: dto.status },
        } as any);
      }
    }

    return license;
  }

  async deleteLicense(licenseId: string, adminId: string) {
    const existing = await this.prisma.userAssetLicense.findUnique({
      where: { id: licenseId },
    });

    if (!existing) {
      throw new NotFoundException('License not found');
    }

    await this.prisma.userAssetLicense.delete({
      where: { id: licenseId },
    });

    // Audit log
    await this.auditService.create({
      eventType: 'LICENSE_DELETED' as any,
      telegramUserId: existing.telegramUserId,
      description: `License deleted for asset ${existing.asset}`,
      metadata: {
        asset: existing.asset,
        previousStatus: existing.status,
        licenseId,
        adminId,
      },
    });

    // Send notification
    await this.notificationService.createNotification({
      telegramUserId: existing.telegramUserId,
      type: 'LICENSE_DELETED',
      title: `${existing.asset} License Removed`,
      message: `Your ${existing.asset} mining output license has been removed.`,
      metadata: { asset: existing.asset },
    } as any);

    return { success: true };
  }

  async grantLicense(dto: GrantLicenseDto, adminId: string) {
    return this.createLicense(dto.telegramUserId, {
      asset: dto.asset,
      licenseType: dto.licenseType,
      expiresAt: dto.expiresAt,
      grantedBy: adminId,
    }, adminId);
  }

  async checkLicense(telegramUserId: string, asset: string): Promise<boolean> {
    const license = await this.prisma.userAssetLicense.findUnique({
      where: {
        telegramUserId_asset: {
          telegramUserId: BigInt(telegramUserId),
          asset,
        },
      },
    });

    if (!license) {
      return false;
    }

    // Check if expired
    if (license.expiresAt && license.expiresAt < new Date()) {
      // Auto-expire
      await this.updateLicense(license.id, { status: AssetLicenseStatus.EXPIRED }, 'SYSTEM');
      return false;
    }

    return license.status === AssetLicenseStatus.ACTIVE;
  }

  async getActiveLicenses(telegramUserId: string) {
    return this.prisma.userAssetLicense.findMany({
      where: {
        telegramUserId: BigInt(telegramUserId),
        status: AssetLicenseStatus.ACTIVE,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      select: {
        asset: true,
        licenseType: true,
        expiresAt: true,
      },
    });
  }
}

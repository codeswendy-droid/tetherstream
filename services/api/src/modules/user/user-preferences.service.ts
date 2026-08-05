import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditEventType } from '../../common/interfaces/user-state.enum';

@Injectable()
export class UserPreferencesService {
  private readonly logger = new Logger(UserPreferencesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getPreferences(telegramUserId: bigint) {
    let prefs = await this.prisma.userPreferences.findUnique({
      where: { telegramUserId },
    });

    if (!prefs) {
      this.logger.log(`Initializing default preferences for user ${telegramUserId}`);
      prefs = await this.prisma.userPreferences.create({
        data: {
          telegramUserId,
          authenticationMethod: 'TELEGRAM',
          notificationChannel: 'TELEGRAM',
          preferredShareChannel: 'TELEGRAM',
          settings: {},
        },
      });
    }

    return {
      telegramUserId: Number(prefs.telegramUserId),
      authenticationMethod: prefs.authenticationMethod,
      notificationChannel: prefs.notificationChannel,
      preferredShareChannel: prefs.preferredShareChannel,
      pushToken: prefs.pushToken,
      settings: prefs.settings || {},
    };
  }

  async updatePreferences(telegramUserId: bigint, data: { settings?: any; notificationChannel?: any }) {
    let prefs = await this.prisma.userPreferences.findUnique({
      where: { telegramUserId },
    });

    if (!prefs) {
      prefs = await this.prisma.userPreferences.create({
        data: {
          telegramUserId,
          authenticationMethod: 'TELEGRAM',
          notificationChannel: data.notificationChannel || 'TELEGRAM',
          preferredShareChannel: 'TELEGRAM',
          settings: data.settings || {},
        },
      });
    } else {
      const mergedSettings = {
        ...(prefs.settings as any || {}),
        ...(data.settings || {}),
      };

      prefs = await this.prisma.userPreferences.update({
        where: { telegramUserId },
        data: {
          ...(data.notificationChannel && { notificationChannel: data.notificationChannel }),
          settings: mergedSettings,
        },
      });
    }

    await this.auditService.create({
      telegramUserId,
      eventType: AuditEventType.USER_UPDATED,
      description: 'User settings preferences synchronized with backend',
      metadata: data,
    });

    return {
      telegramUserId: Number(prefs.telegramUserId),
      authenticationMethod: prefs.authenticationMethod,
      notificationChannel: prefs.notificationChannel,
      preferredShareChannel: prefs.preferredShareChannel,
      pushToken: prefs.pushToken,
      settings: prefs.settings || {},
    };
  }
}

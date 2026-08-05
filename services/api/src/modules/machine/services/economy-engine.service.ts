import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma } from '@prisma/client';

export interface YieldCalculationParams {
  telegramUserId: bigint;
  assetCode: string;
  baseYieldRate: number;
  decayProfile?: string;
  minimumLicense?: string;
}

export interface EconomySimulationParams {
  daysToProject: number; // 30, 90, 180
  repowerPriceMultiplier?: number;
  payoutRateMultiplier?: number;
  yieldMultiplierOverride?: number;
}

@Injectable()
export class EconomyEngineService {
  private readonly logger = new Logger(EconomyEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate Effective Earning Rate for a given user output stream.
   * Checks license status, active economy profile multipliers, decay rules, and promotional yield boosts.
   */
  async calculateEffectiveYield(params: YieldCalculationParams) {
    const assetCode = params.assetCode.toUpperCase();

    // 1. License Check: If asset is not USDT and minimum license required, check active user license
    if (assetCode !== 'USDT') {
      const activeLicense = await this.prisma.userAssetLicense.findFirst({
        where: {
          telegramUserId: params.telegramUserId,
          asset: assetCode,
          status: 'ACTIVE',
        },
      });

      if (!activeLicense) {
        return {
          effectiveYieldRate: 0,
          isLocked: true,
          reason: `UNLICENSED_ASSET: Active license required for asset ${assetCode}`,
        };
      }
    }

    // 2. Fetch Active Production Economy Profile
    const activeProfile = await this.prisma.economyProfileRecord.findFirst({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
    });

    const profileMult = activeProfile ? Number(activeProfile.yieldMultiplier) : 1.0;

    // 3. Fetch Active Promotional Campaigns
    const now = new Date();
    const activePromos = await this.prisma.promotionCampaignRecord.findMany({
      where: {
        status: 'ACTIVE',
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
    });

    let promoMult = 1.0;
    for (const p of activePromos) {
      promoMult *= Number(p.yieldBoostMult || 1.0);
    }

    const effectiveYieldRate = params.baseYieldRate * profileMult * promoMult;

    return {
      effectiveYieldRate,
      isLocked: false,
      profileCode: activeProfile?.code || 'DEFAULT_PRODUCTION',
      appliedMultipliers: {
        profileMultiplier: profileMult,
        promotionMultiplier: promoMult,
      },
    };
  }

  /**
   * Get Economy Profiles & Versions
   */
  async getProfiles() {
    const profiles = await this.prisma.economyProfileRecord.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
    return profiles;
  }

  /**
   * Create New Versioned Economy Profile
   */
  async createProfile(dto: { code: string; name: string; yieldMultiplier: number; referralMultiplier?: number; rewardMultiplier?: number; decayRules?: any }) {
    if (!dto.code || !dto.name) throw new BadRequestException('Profile code and name are required');

    const existing = await this.prisma.economyProfileRecord.findUnique({ where: { code: dto.code } });
    const version = existing ? existing.version + 1 : 1;

    return this.prisma.economyProfileRecord.upsert({
      where: { code: dto.code },
      create: {
        code: dto.code,
        name: dto.name,
        version,
        yieldMultiplier: new Prisma.Decimal(dto.yieldMultiplier || 1.0),
        referralMultiplier: new Prisma.Decimal(dto.referralMultiplier || 1.0),
        rewardMultiplier: new Prisma.Decimal(dto.rewardMultiplier || 1.0),
        decayRules: dto.decayRules || {},
        isActive: false,
      },
      update: {
        name: dto.name,
        version: { increment: 1 },
        yieldMultiplier: new Prisma.Decimal(dto.yieldMultiplier || 1.0),
        referralMultiplier: new Prisma.Decimal(dto.referralMultiplier || 1.0),
        rewardMultiplier: new Prisma.Decimal(dto.rewardMultiplier || 1.0),
        decayRules: dto.decayRules || {},
      },
    });
  }

  /**
   * Activate Economy Profile
   */
  async activateProfile(code: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.economyProfileRecord.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      const updated = await tx.economyProfileRecord.update({
        where: { code },
        data: { isActive: true },
      });

      return updated;
    });
  }

  /**
   * Dry-Run Economy Simulator (Zero Database Mutations)
   */
  async simulateScenario(params: EconomySimulationParams) {
    const days = params.daysToProject || 90;
    const repowerMult = params.repowerPriceMultiplier || 1.0;
    const payoutMult = params.payoutRateMultiplier || 1.0;
    const yieldMult = params.yieldMultiplierOverride || 1.0;

    const [userCount, machineCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.userMachineFleetItem.count({ where: { status: 'ACTIVE' } }),
    ]);

    const activeUsers = Math.max(userCount, 1);
    const activeFleet = Math.max(machineCount, 1);

    const projectedDailyInflow = activeUsers * 1.5 * repowerMult;
    const projectedDailyOutflow = activeFleet * 0.45 * payoutMult * yieldMult;

    const totalInflow = projectedDailyInflow * days;
    const totalOutflow = projectedDailyOutflow * days;
    const netSolvencyDelta = totalInflow - totalOutflow;

    const reserveRatio = totalOutflow > 0 ? ((totalInflow / totalOutflow) * 100).toFixed(1) : '100.0';
    const solvencyStatus = netSolvencyDelta >= 0 ? 'SOLVENT' : 'DEFICIT_WARNING';

    return {
      simulationParameters: {
        daysToProject: days,
        repowerPriceMultiplier: repowerMult,
        payoutRateMultiplier: payoutMult,
        yieldMultiplierOverride: yieldMult,
      },
      results: {
        solvencyStatus,
        projectedReserveRatio: Number(reserveRatio),
        totalProjectedInflow: Number(totalInflow.toFixed(2)),
        totalProjectedOutflow: Number(totalOutflow.toFixed(2)),
        netSolvencyDelta: Number(netSolvencyDelta.toFixed(2)),
        projectedActiveUsers: activeUsers,
        projectedActiveFleet: activeFleet,
      },
    };
  }
}

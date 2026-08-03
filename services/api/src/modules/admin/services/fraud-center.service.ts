import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export interface FraudRiskUserItem {
  telegramUserId: string;
  username: string;
  name: string;
  riskScore: number;
  riskSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  triggers: string[];
  referralCount: number;
  loginCount: number;
  state: string;
  createdAt: string;
}

@Injectable()
export class FraudCenterService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates and lists high-risk users and potential fraud patterns
   */
  async getFraudRiskOverview() {
    const users = await this.prisma.user.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        trustProfile: true,
        referralAsReferrer: true,
        userMachines: true,
      },
    });

    const riskUsers: FraudRiskUserItem[] = [];

    for (const u of users) {
      let riskScore = 0;
      const triggers: string[] = [];

      // 1. Unverified or rapidly created referrals
      if (u.referralAsReferrer.length > 20 && u.payingReferrals === 0) {
        riskScore += 35;
        triggers.push('High Referral Count with Zero Paying Referrals (Possible Referral Farm)');
      }

      // 2. High login count but no machines or active platform engagement
      if (u.loginCount > 50 && u.userMachines.length === 0) {
        riskScore += 20;
        triggers.push('High Bot-like Login Count without Machine Acquisition');
      }

      // 3. Low trust score from trust profile
      if (u.trustProfile && u.trustProfile.trustScore < 40) {
        riskScore += 30;
        triggers.push('Low System Trust Score');
      }

      // 4. Suspended/Frozen state
      if (u.state === 'SUSPENDED_USER' || u.state === 'BANNED_USER' || u.state === 'FROZEN') {
        riskScore += 40;
        triggers.push(`Account state marked as ${u.state}`);
      }

      if (riskScore > 15) {
        const severity = riskScore >= 70 ? 'CRITICAL' : riskScore >= 45 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW';
        riskUsers.push({
          telegramUserId: u.telegramUserId.toString(),
          username: u.telegramUsername || 'no_username',
          name: `${u.firstName} ${u.lastName || ''}`,
          riskScore: Math.min(riskScore, 100),
          riskSeverity: severity,
          triggers,
          referralCount: u.referralAsReferrer.length,
          loginCount: u.loginCount,
          state: u.state,
          createdAt: u.createdAt.toISOString(),
        });
      }
    }

    // Sort by risk score desc
    riskUsers.sort((a, b) => b.riskScore - a.riskScore);

    return {
      highRiskUserCount: riskUsers.filter((r) => r.riskSeverity === 'HIGH' || r.riskSeverity === 'CRITICAL').length,
      totalFlaggedUsers: riskUsers.length,
      riskUsers,
    };
  }
}

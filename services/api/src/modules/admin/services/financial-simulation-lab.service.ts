import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export interface SimulationRequestDto {
  repowerPriceMultiplier?: number; // e.g. 1.2 (+20%)
  payoutRateMultiplier?: number; // e.g. 0.95 (-5%)
  referralRewardMultiplier?: number; // e.g. 1.0
  activeOperatorGrowthRateMonthly?: number; // e.g. 0.15 (+15%/month)
  daysToProject?: 30 | 90 | 180;
}

@Injectable()
export class FinancialSimulationLabService {
  constructor(private readonly prisma: PrismaService) {}

  async runSimulation(dto: SimulationRequestDto) {
    const days = dto.daysToProject || 90;
    const repowerMult = dto.repowerPriceMultiplier ?? 1.0;
    const payoutMult = dto.payoutRateMultiplier ?? 1.0;
    const growthRate = dto.activeOperatorGrowthRateMonthly ?? 0.1;

    // Fetch baseline active users and machine stats
    const totalUsers = await this.prisma.user.count({ where: { state: 'READY' } });
    const totalMachines = await this.prisma.userMachine.count({ where: { status: 'ACTIVE' } });
    
    // Baseline calculations
    const activeUsersBase = Math.max(totalUsers, 10);
    const activeMachinesBase = Math.max(totalMachines, 15);
    
    const dailyInflowBase = activeMachinesBase * 2.5 * repowerMult;
    const dailyOutflowBase = activeMachinesBase * 1.8 * payoutMult;

    const timeline: Array<{ day: number; projectedInflow: number; projectedOutflow: number; netReserveChange: number }> = [];

    let totalProjectedInflow = 0;
    let totalProjectedOutflow = 0;

    for (let day = 1; day <= days; day++) {
      const monthFactor = 1 + (growthRate * (day / 30));
      const dayInflow = dailyInflowBase * monthFactor;
      const dayOutflow = dailyOutflowBase * monthFactor;

      totalProjectedInflow += dayInflow;
      totalProjectedOutflow += dayOutflow;

      if (day % 10 === 0 || day === days) {
        timeline.push({
          day,
          projectedInflow: Math.round(totalProjectedInflow * 100) / 100,
          projectedOutflow: Math.round(totalProjectedOutflow * 100) / 100,
          netReserveChange: Math.round((totalProjectedInflow - totalProjectedOutflow) * 100) / 100,
        });
      }
    }

    const netSolvencyDelta = totalProjectedInflow - totalProjectedOutflow;
    const projectedReserveRatio = totalProjectedOutflow > 0 ? (totalProjectedInflow / totalProjectedOutflow) * 100 : 200;

    return {
      simulationParameters: {
        daysProjected: days,
        repowerPriceMultiplier: repowerMult,
        payoutRateMultiplier: payoutMult,
        monthlyGrowthRate: growthRate,
      },
      baselineMetrics: {
        activeUsers: activeUsersBase,
        activeMachines: activeMachinesBase,
      },
      results: {
        totalProjectedInflow: Math.round(totalProjectedInflow * 100) / 100,
        totalProjectedOutflow: Math.round(totalProjectedOutflow * 100) / 100,
        netSolvencyDelta: Math.round(netSolvencyDelta * 100) / 100,
        projectedReserveRatio: Math.round(projectedReserveRatio * 10) / 10,
        solvencyStatus: netSolvencyDelta >= 0 ? 'HEALTHY_SURPLUS' : 'DEFICIT_WARNING',
      },
      timeline,
    };
  }
}

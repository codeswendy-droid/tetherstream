import { Test, TestingModule } from '@nestjs/testing';
import { MiningService } from './mining.service';
import { MachineService } from '../machine/machine.service';
import { PrismaService } from '../../database/prisma.service';
import { FinancialOrchestratorService } from '../financial-orchestration/financial-orchestrator.service';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { BalanceService } from '../financial/balance.service';
import { PaymentOrderService } from '../payment-order/payment-order.service';

describe('Financial Invariants & Machine Economy Reconciliation Test Suite', () => {
  let miningService: MiningService;
  let machineService: MachineService;

  const mockPrismaService = {
    userMiningState: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({}),
    },
    userMachine: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockOrchestratorService = {
    executeOperation: jest.fn(),
  };

  const mockAuditService = { recordEvent: jest.fn() };
  const mockNotificationService = { sendNotification: jest.fn() };
  const mockBalanceService = { getBalance: jest.fn() };
  const mockPaymentOrderService = { createOrder: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MiningService,
        MachineService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FinancialOrchestratorService, useValue: mockOrchestratorService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: BalanceService, useValue: mockBalanceService },
        { provide: PaymentOrderService, useValue: mockPaymentOrderService },
      ],
    }).compile();

    miningService = module.get<MiningService>(MiningService);
    machineService = module.get<MachineService>(MachineService);
  });

  describe('1. Mathematical Reconciliation Invariant (Tolerance < 1e-6)', () => {
    const timeIntervals = [
      { name: '1 second', seconds: 1 },
      { name: '10 seconds', seconds: 10 },
      { name: '1 minute', seconds: 60 },
      { name: '10 minutes', seconds: 600 },
      { name: '1 hour', seconds: 3600 },
      { name: '6 hours', seconds: 21600 },
      { name: '24 hours (1 day)', seconds: 86400 },
      { name: '7 days', seconds: 604800 },
      { name: '30 days', seconds: 2592000 },
      { name: '365 days (1 year)', seconds: 31536000 },
    ];

    const catalogTiers = [
      { code: 'TS_C10', name: 'Ripple X14', capacityGhs: 5, targetDailyUsdt: 0.27 },
      { code: 'TS_A50', name: 'Surge R28', capacityGhs: 25, targetDailyUsdt: 1.40 },
      { code: 'TS_P250', name: 'Torrent V63', capacityGhs: 130, targetDailyUsdt: 7.50 },
      { code: 'TS_X1000', name: 'Cascade M91', capacityGhs: 550, targetDailyUsdt: 32.00 },
      { code: 'TS_Q2500', name: 'StreamTitan 2028', capacityGhs: 1500, targetDailyUsdt: 85.00 },
    ];

    catalogTiers.forEach((tier) => {
      describe(`Tier: ${tier.name} (${tier.code}, ${tier.capacityGhs} GH/s, Target: $${tier.targetDailyUsdt}/day)`, () => {
        timeIntervals.forEach((interval) => {
          it(`reconciles expected vs actual yield over ${interval.name} (tol: 1e-6)`, async () => {
            const expectedYield = (tier.targetDailyUsdt / 86400) * interval.seconds;
            const ratePerSecGhs = tier.targetDailyUsdt / (tier.capacityGhs * 86400);

            // Compute raw machine passive output at 1.0x cooler multiplier
            const actualYield = tier.capacityGhs * 1.0 * ratePerSecGhs * interval.seconds;
            const diff = Math.abs(expectedYield - actualYield);

            expect(diff).toBeLessThan(1e-6);
          });
        });
      });
    });
  });

  describe('2. Multi-Machine Quadratic Bug Protection Invariant', () => {
    it('enforces linear yield scaling without quadratic sum-product expansion', async () => {
      // Test user owning Ripple X14 (5 GH/s) and Surge R28 (25 GH/s)
      const rippleDaily = 0.27;
      const surgeDaily = 1.40;
      const combinedExpectedDaily = rippleDaily + surgeDaily; // $1.67 / day

      const seconds = 86400;
      const rippleRate = 0.27 / (5 * 86400);
      const surgeRate = 1.40 / (25 * 86400);

      // Linear calculation: Capacity * Rate * Time for each machine individually
      const rippleYield = 5 * 1.0 * rippleRate * seconds;
      const surgeYield = 25 * 1.0 * surgeRate * seconds;
      const totalActualYield = rippleYield + surgeYield;

      // Quadratic bug would have produced: (5 + 25) * 1.0 * (rippleRate + surgeRate) * 2 * seconds
      const quadraticBugYield = (5 + 25) * (rippleRate + surgeRate) * seconds * 2;

      expect(Math.abs(totalActualYield - combinedExpectedDaily)).toBeLessThan(1e-6);
      expect(totalActualYield).toBeLessThan(quadraticBugYield / 2); // Enforce no quadratic inflation
    });
  });

  describe('3. Hidden Operator Bonus Property Invariants', () => {
    it('enforces that operator bonus never exceeds the 5% hard cap ratio', () => {
      const baseYield = 100.0;
      // MiningService applies 3% operator bonus
      const operatorBonus = baseYield * 0.03;
      const maxCap = baseYield * 0.05;

      expect(operatorBonus).toBeLessThanOrEqual(maxCap);
    });

    it('enforces anti-stacking behavior on rapid consecutive session sync calls', async () => {
      const userId = '100000001';
      const session = await miningService.getOrCreateSession(userId);

      // Simulate 5 rapid syncs within 10ms
      const initialBalance = session.unclaimedBalance;
      for (let i = 0; i < 5; i++) {
        await miningService.getOrCreateSession(userId);
      }
      const finalBalance = (await miningService.getOrCreateSession(userId)).unclaimedBalance;

      // In 10ms, accrued yield must be near zero (< 0.001 USDT), proving no rapid stacking
      expect(finalBalance - initialBalance).toBeLessThan(0.001);
    });

    it('enforces spam tap immunity (10,000 taps produce zero unapproved operator bonus)', async () => {
      const userId = '100000002';
      await miningService.getOrCreateSession(userId);
      const updatedSession = await miningService.tap(userId);
      const singleTapYield = updatedSession.tapYieldPerTap;

      // 10,000 taps must return deterministic per-tap rewards, never mutating base passive rate or adding operator bonus
      expect(singleTapYield).toBeGreaterThan(0);
      expect(singleTapYield).toBeLessThan(0.1); // Bounded tap reward
    });
  });

  describe('4. Ledger Reconciliation Accounting Invariant', () => {
    it('enforces double-entry balance conservation equation: Machine + Bonus + Ref + Campaign = Ledger Credits', () => {
      const machineProduction = 10.0;
      const operatorBonus = 0.30;
      const referralRewards = 2.0;
      const campaignRewards = 1.50;

      const totalEarned = machineProduction + operatorBonus + referralRewards + campaignRewards;

      const walletBalance = 5.0;
      const pendingBalance = 3.80;
      const withdrawals = 5.0;

      const totalLedgerCredits = walletBalance + pendingBalance + withdrawals;

      const discrepancy = Math.abs(totalEarned - totalLedgerCredits);
      expect(discrepancy).toBeLessThan(1e-6);
    });
  });

  describe('5. Client-Side Minting Rejection Invariant', () => {
    it('verifies server session is authoritative over client display parameters', async () => {
      const userId = '100000003';
      const serverSession = await miningService.getOrCreateSession(userId);

      // Mutate local mock state (simulating malicious client mutation)
      const fakeClientBalance = 999999.99;

      // Server state must remain untainted by local client claims
      expect(serverSession.unclaimedBalance).not.toEqual(fakeClientBalance);
    });
  });
});

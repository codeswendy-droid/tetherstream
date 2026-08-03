import { Test, TestingModule } from '@nestjs/testing';
import { OperatorIntelligenceService } from './operator-intelligence.service';
import { WithdrawalEligibilityService } from '../../financial/withdrawal-eligibility.service';
import { TreasuryService } from '../treasury.service';
import { PrismaService } from '../../../database/prisma.service';

describe('OperatorIntelligence & Withdrawal Eligibility Test Suite', () => {
  let operatorIntelService: OperatorIntelligenceService;
  let eligibilityService: WithdrawalEligibilityService;

  const mockPrismaService = {
    userMachine: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'm1', purchasePrice: { toNumber: () => 50 }, status: 'ACTIVE', lifetimeEarnings: { toNumber: () => 10 } },
      ]),
    },
    settlementSession: {
      findMany: jest.fn().mockResolvedValue([
        { requestedAmount: { toNumber: () => 100 }, status: 'COMPLETED' },
      ]),
    },
    referralRelationship: {
      findMany: jest.fn().mockResolvedValue([{ id: 'ref1' }, { id: 'ref2' }]),
    },
    financialAccount: {
      findUnique: jest.fn().mockResolvedValue({ id: 'acc1', status: 'ACTIVE' }),
    },
  };

  const mockTreasuryService = {
    getMetrics: jest.fn().mockResolvedValue({
      reserveRatio: 160,
      rcr: 1.48,
      totalLiquidity: 25000,
      userLiabilities: 16800,
      healthStatus: 'HEALTHY',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperatorIntelligenceService,
        WithdrawalEligibilityService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TreasuryService, useValue: mockTreasuryService },
      ],
    }).compile();

    operatorIntelService = module.get<OperatorIntelligenceService>(OperatorIntelligenceService);
    eligibilityService = module.get<WithdrawalEligibilityService>(WithdrawalEligibilityService);
  });

  it('should calculate valid Operator Lifetime Value (OLTV), TCI, NRS, and RCS metrics', async () => {
    const metrics = await operatorIntelService.getOperatorMetrics('123456');

    expect(metrics).toBeDefined();
    expect(metrics.oltv).toBeGreaterThan(0);
    expect(metrics.tci).toBeGreaterThan(0);
    expect(metrics.nrs).toBe(100); // 2 referrals * 50
    expect(metrics.rcs).toBeGreaterThan(0);
    expect(metrics.directPurchasesTotal).toBe(50);
  });

  it('should evaluate internal withdrawal eligibility and return 7-rule diagnostics', async () => {
    const internalEval = await eligibilityService.evaluateEligibility('123456', 50.0);

    expect(internalEval.eligible).toBe(true);
    expect(internalEval.internalEligibilityScore).toBeGreaterThanOrEqual(70);
    expect(internalEval.fraudScore).toBeLessThan(50);
    expect(internalEval.passedRules.length).toBeGreaterThan(0);
  });

  it('should format public eligibility response and STRIP all internal scores and fraud metrics', async () => {
    const publicEval = await eligibilityService.getPublicEligibility('123456', 50.0);

    expect(publicEval).toBeDefined();
    expect(publicEval.eligible).toBe(true);
    expect(publicEval.publicStatusMessage).toContain('Withdrawal request eligible');

    // Confirm strict visibility enforcement
    expect((publicEval as any).internalEligibilityScore).toBeUndefined();
    expect((publicEval as any).fraudScore).toBeUndefined();
    expect((publicEval as any).passedRules).toBeUndefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { TreasuryService } from './treasury.service';
import { PrismaService } from '../../database/prisma.service';

describe('TreasuryService — Treasury Health & Safety Test Suite', () => {
  let treasuryService: TreasuryService;

  const mockPrismaService = {
    ledgerEntry: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 1000 } }),
    },
    settlementSession: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { expectedCryptoAmount: 500 } }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    financialTransaction: {
      count: jest.fn().mockResolvedValue(50),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreasuryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    treasuryService = module.get<TreasuryService>(TreasuryService);
  });

  it('should calculate valid Treasury Health Metrics and Treasury Health Score', async () => {
    const metrics = await treasuryService.getMetrics();

    expect(metrics).toBeDefined();
    expect(metrics.reserveRatio).toBeGreaterThan(0);
    expect(metrics.treasuryHealthScore).toBeGreaterThanOrEqual(0);
    expect(metrics.treasuryHealthScore).toBeLessThanOrEqual(100);
    expect(metrics.healthStatus).toBeDefined();
  });

  it('should validate withdrawal safety under healthy reserve ratio', async () => {
    const check = await treasuryService.checkWithdrawalSafety(100);

    expect(check.safe).toBe(true);
    expect(check.reason).toBeUndefined();
  });

  it('should reject unsafe large withdrawal that exceeds 25% of liquidity', async () => {
    const check = await treasuryService.checkWithdrawalSafety(50000);

    expect(check.safe).toBe(false);
    expect(check.reason).toContain('exceeds maximum single transaction limit');
  });
});

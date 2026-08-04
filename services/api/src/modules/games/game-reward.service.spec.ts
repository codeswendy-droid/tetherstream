import { Test, TestingModule } from '@nestjs/testing';
import { GameRewardService } from './game-reward.service';
import { GameEventService } from './game-event.service';
import { RewardService } from '../growth/reward.service';
import { PrismaService } from '../../database/prisma.service';
import { GameCatalog, GameDifficulty, GameSession, GameSessionStatus, Prisma } from '@prisma/client';

function makeSkillGame(overrides: Partial<GameCatalog> = {}): GameCatalog {
  return {
    id: 'g1',
    gameId: 'hoop-masters',
    code: 'HOOPS',
    name: 'Hoop Masters',
    description: '',
    category: 'skill',
    icon: '🏀',
    accentColor: '#00e676',
    crystalCost: 3,
    dailyLimit: 15,
    estimatedDurationSec: 60,
    difficulty: GameDifficulty.MEDIUM,
    enabled: true,
    rewardConfig: {
      crystalRewards: [
        { minScore: 0, maxScore: 4, crystals: 1 },
        { minScore: 5, maxScore: 9, crystals: 3 },
        { minScore: 10, maxScore: 1000, crystals: 6 },
      ],
      usdtRewards: [
        { minScore: 0, maxScore: 9, usdt: '0', probability: 0 },
        { minScore: 10, maxScore: 1000, usdt: '0.10', probability: 1 },
      ],
    } as unknown as Prisma.JsonValue,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeChanceGame(overrides: Partial<GameCatalog> = {}): GameCatalog {
  return {
    id: 'g2',
    gameId: 'crypto-roulette',
    code: 'ROULETTE',
    name: 'Crypto Roulette',
    description: '',
    category: 'chance',
    icon: '🎡',
    accentColor: '#00e676',
    crystalCost: 5,
    dailyLimit: 10,
    estimatedDurationSec: 30,
    difficulty: GameDifficulty.EASY,
    enabled: true,
    rewardConfig: {
      chanceGame: true,
      sectors: [
        { label: '5 💎', type: 'CRYSTALS', value: 5, weight: 25, premium: false },
        { label: '₮0.05', type: 'USDT', value: 0.05, weight: 10, premium: false },
        { label: '₮1.00', type: 'USDT', value: 1, weight: 0.25, premium: true },
      ],
    } as unknown as Prisma.JsonValue,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    id: 's1',
    telegramUserId: BigInt(1),
    gameId: 'hoop-masters',
    status: GameSessionStatus.STARTED,
    crystalCost: 3,
    serverStartedAt: new Date(),
    serverEndedAt: null,
    durationMs: null,
    score: 0,
    crystalsEarned: 0,
    usdtEarned: null,
    validation: null,
    reference: 'ref',
    createdAt: new Date(),
    ...overrides,
  };
}

describe('Game Reward Engine', () => {
  let service: GameRewardService;

  const mockEventService = {
    resolveMultipliers: jest.fn().mockResolvedValue({ crystalMultiplier: 1, usdtMultiplier: 1, events: [] }),
  };
  const mockRewardService = {
    createReward: jest.fn().mockImplementation((d: any) => Promise.resolve({ id: `rw_${d.reference}` })),
  };
  const mockPrisma = {
    gameSession: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameRewardService,
        { provide: GameEventService, useValue: mockEventService },
        { provide: RewardService, useValue: mockRewardService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<GameRewardService>(GameRewardService);
  });

  describe('skill games', () => {
    it('maps score to the configured crystal band', async () => {
      const game = makeSkillGame();
      const result = await service.computeRewards(game, makeSession(), 7);
      expect(result.crystals).toBe(3);
      expect(result.usdt).toBeNull();
    });

    it('grants USDT when the score crosses the band with probability 1', async () => {
      const game = makeSkillGame();
      const result = await service.computeRewards(game, makeSession(), 15);
      expect(result.usdt).toBe('0.100000');
    });

    it('caps at the top crystal band and computes XP', async () => {
      const game = makeSkillGame();
      const result = await service.computeRewards(game, makeSession(), 500);
      expect(result.crystals).toBe(6);
      expect(result.xp).toBe(500);
    });
  });

  describe('chance games', () => {
    it('pays the predetermined crystal sector', async () => {
      const game = makeChanceGame();
      const result = await service.computeRewards(game, makeSession(), 1, 0);
      expect(result.crystals).toBe(5);
      expect(result.usdt).toBeNull();
    });

    it('pays the predetermined USDT sector', async () => {
      const game = makeChanceGame();
      const result = await service.computeRewards(game, makeSession(), 1, 2);
      expect(result.usdt).toBe('1.000000');
      expect(result.crystals).toBe(0);
    });

    it('rejects a missing outcome (client tampering)', async () => {
      const game = makeChanceGame();
      await expect(service.computeRewards(game, makeSession(), 1, null)).rejects.toThrow();
    });
  });

  describe('event multipliers', () => {
    it('doubles crystal payouts during a double-crystal event', async () => {
      mockEventService.resolveMultipliers.mockResolvedValueOnce({
        crystalMultiplier: 2,
        usdtMultiplier: 1,
        events: ['WEEKEND_REACTOR_RUSH'],
      });
      const game = makeSkillGame();
      const result = await service.computeRewards(game, makeSession(), 7);
      expect(result.crystals).toBe(6);
      expect(result.events).toEqual(['WEEKEND_REACTOR_RUSH']);
    });
  });

  describe('economy protection', () => {
    it('suppresses USDT when the daily cap would be exceeded', async () => {
      const game = makeSkillGame({
        rewardConfig: {
          crystalRewards: [{ minScore: 0, maxScore: 1000, crystals: 1 }],
          usdtRewards: [{ minScore: 10, maxScore: 1000, usdt: '0.10', probability: 1 }],
          dailyUsdtCap: '0.50',
        } as unknown as Prisma.JsonValue,
      });
      mockPrisma.gameSession.findMany.mockResolvedValueOnce([
        { usdtEarned: { toNumber: () => 0.45 } },
      ]);
      const result = await service.computeRewards(game, makeSession(), 15);
      expect(result.usdt).toBeNull();
      expect(result.crystals).toBe(1);
    });

    it('allows USDT when within the daily cap', async () => {
      const game = makeSkillGame({
        rewardConfig: {
          crystalRewards: [{ minScore: 0, maxScore: 1000, crystals: 1 }],
          usdtRewards: [{ minScore: 10, maxScore: 1000, usdt: '0.10', probability: 1 }],
          dailyUsdtCap: '0.50',
        } as unknown as Prisma.JsonValue,
      });
      mockPrisma.gameSession.findMany.mockResolvedValueOnce([
        { usdtEarned: { toNumber: () => 0.05 } },
      ]);
      const result = await service.computeRewards(game, makeSession(), 15);
      expect(result.usdt).toBe('0.100000');
    });
  });

  describe('USDT claim-queue integration', () => {
    it('creates an idempotent claimable reward through RewardService', async () => {
      const game = makeSkillGame();
      const session = makeSession();
      const reward = await service.createUsdtReward(game, session, 15, '0.100000');
      expect(mockRewardService.createReward).toHaveBeenCalledWith(
        expect.objectContaining({
          reference: `game_usdt_${session.id}`,
          amount: '0.100000',
          telegramUserId: BigInt(1),
        }),
      );
      expect(reward.id).toBe(`rw_game_usdt_${session.id}`);
    });
  });
});

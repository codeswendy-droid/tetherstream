import { Test, TestingModule } from '@nestjs/testing';
import { GameAntiCheatService } from './game-anti-cheat.service';
import { GameCatalog, GameDifficulty, GameSession, GameSessionStatus, Prisma } from '@prisma/client';

function makeGame(overrides: Partial<GameCatalog> = {}): GameCatalog {
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
      minDurationMs: 15000,
      maxDurationMs: 300000,
      minScorePerSecond: 0.02,
      maxScorePerSecond: 2,
      winScoreThreshold: 5,
    } as unknown as Prisma.JsonValue,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeSession(startedSecondsAgo: number, overrides: Partial<GameSession> = {}): GameSession {
  return {
    id: 's1',
    telegramUserId: BigInt(1),
    gameId: 'hoop-masters',
    status: GameSessionStatus.STARTED,
    crystalCost: 3,
    serverStartedAt: new Date(Date.now() - startedSecondsAgo * 1000),
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

describe('Game Anti-Cheat Service', () => {
  let service: GameAntiCheatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameAntiCheatService],
    }).compile();
    service = module.get<GameAntiCheatService>(GameAntiCheatService);
  });

  it('accepts a plausible score', () => {
    const game = makeGame();
    const session = makeSession(90);
    const verdict = service.validate(game, session, 12, 60000);
    expect(verdict.ok).toBe(true);
    expect(verdict.status).toBe('COMPLETED');
  });

  it('rejects a score submitted faster than physics allows', () => {
    const game = makeGame();
    const session = makeSession(30);
    // 100 points in 20 seconds = 5/s, far beyond max 2/s
    const verdict = service.validate(game, session, 100, 20000);
    expect(verdict.ok).toBe(false);
    expect(verdict.reasons[0]).toContain('SCORE_RATE');
  });

  it('rejects a score submitted below the minimum duration floor', () => {
    const game = makeGame();
    const session = makeSession(1);
    const verdict = service.validate(game, session, 1, 3000);
    expect(verdict.ok).toBe(false);
    expect(verdict.reasons[0]).toBe('REPORTED_DURATION_BELOW_MINIMUM');
  });

  it('voids sessions that exceeded the maximum server-side duration', () => {
    const game = makeGame();
    const session = makeSession(60 * 60); // started 1 hour ago
    const verdict = service.validate(game, session, 12, 60000);
    expect(verdict.ok).toBe(false);
    expect(verdict.status).toBe('VOID');
  });

  it('rejects non-integer or negative scores', () => {
    const game = makeGame();
    const session = makeSession(90);
    expect(service.validate(game, session, -5, 60000).ok).toBe(false);
    expect(service.validate(game, session, 5.7, 60000).ok).toBe(false);
  });

  it('rejects uniform telemetry intervals (bot/macro heuristic)', () => {
    const game = makeGame();
    const session = makeSession(90);
    const telemetry = Array.from({ length: 20 }, (_, i) => ({ action: 'tap', t: 1000 + i * 100 }));
    const verdict = service.validate(game, session, 12, 60000, telemetry);
    expect(verdict.ok).toBe(false);
    expect(verdict.reasons[0]).toBe('UNIFORM_TELEMETRY_INTERVAL_BOT_HEURISTIC');
  });

  it('rejects non-monotonic telemetry timestamps (tampering)', () => {
    const game = makeGame();
    const session = makeSession(90);
    const telemetry = [
      { action: 'tap', t: 5000 },
      { action: 'tap', t: 1000 },
    ];
    const verdict = service.validate(game, session, 12, 60000, telemetry);
    expect(verdict.ok).toBe(false);
    expect(verdict.reasons[0]).toBe('NON_MONOTONIC_TELEMETRY_TIMESTAMPS');
  });

  it('accepts telemetry with natural jitter across the play span', () => {
    const game = makeGame();
    const session = makeSession(90);
    // 12 events spread over ~50 seconds with jittered gaps — human-like timing
    const telemetry = Array.from({ length: 12 }, (_, i) => ({
      action: 'tap',
      t: Math.floor(2000 + i * 4500 + Math.sin(i * 7) * 800),
    }));
    const verdict = service.validate(game, session, 12, 60000, telemetry);
    expect(verdict.ok).toBe(true);
  });

  it('detects a win only above the configured threshold', () => {
    const game = makeGame();
    const session = makeSession(90, { crystalsEarned: 3, usdtEarned: null });
    expect(service.isWin(4, session, game)).toBe(false);
    expect(service.isWin(5, session, game)).toBe(true);
  });
});

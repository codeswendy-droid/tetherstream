import { Injectable } from '@nestjs/common';
import { GameCatalog, GameSession, Prisma } from '@prisma/client';
import type { AntiCheatVerdict, GameRewardConfig, GameSessionStats } from './game-types';

export interface TelemetryEvent {
  action: string;
  t: number;
}

/**
 * Server-side score validation. The client never determines payouts — scores,
 * timing and telemetry are validated against hard bounds from the game's
 * reward config. Verdicts:
 *  - COMPLETED: score is plausible, rewards issued
 *  - REJECTED:  score is impossible, session voided with no reward
 *  - VOID:      session exceeded maximum duration / tampered, no reward
 */
@Injectable()
export class GameAntiCheatService {
  private getConfig(game: GameCatalog): GameRewardConfig {
    return (game.rewardConfig as unknown as GameRewardConfig) ?? {};
  }

  validate(
    game: GameCatalog,
    session: GameSession,
    score: number,
    durationMs: number,
    telemetry?: TelemetryEvent[],
    stats?: GameSessionStats,
  ): AntiCheatVerdict {
    const config = this.getConfig(game);
    const reasons: string[] = [];
    const now = new Date();

    // 1. Session lifetime — the server clocks the real duration
    const serverDuration = now.getTime() - session.serverStartedAt.getTime();
    const maxDurationMs = config.maxDurationMs ?? game.estimatedDurationSec * 1000 * 5;
    if (serverDuration > maxDurationMs) {
      reasons.push('SESSION_EXCEEDED_MAX_DURATION');
      return { ok: false, status: 'VOID', reasons };
    }

    // 2. Reported duration sanity (client-reported value may not be trusted)
    const minDurationMs = config.minDurationMs ?? Math.max(8000, game.estimatedDurationSec * 1000 * 0.25);
    if (durationMs < minDurationMs) {
      reasons.push('REPORTED_DURATION_BELOW_MINIMUM');
      return { ok: false, status: 'REJECTED', reasons };
    }
    if (durationMs > serverDuration + 5000) {
      reasons.push('REPORTED_DURATION_EXCEEDS_SERVER_TIME');
      return { ok: false, status: 'REJECTED', reasons };
    }

    // 3. Score bounds
    if (!Number.isInteger(score) || score < 0) {
      reasons.push('INVALID_SCORE');
      return { ok: false, status: 'REJECTED', reasons };
    }

    const scorePerSecond = score / (durationMs / 1000);
    const maxScorePerSecond = config.maxScorePerSecond ?? config.antiCheat?.maxScorePerSecond ?? 5;
    if (score > 0 && scorePerSecond > maxScorePerSecond) {
      reasons.push(`SCORE_RATE_EXCEEDS_PHYSICS_LIMIT (${scorePerSecond.toFixed(2)}/s > ${maxScorePerSecond}/s)`);
      return { ok: false, status: 'REJECTED', reasons };
    }

    const minScorePerSecond = config.minScorePerSecond ?? 0;
    if (minScorePerSecond > 0 && scorePerSecond > 0 && scorePerSecond < minScorePerSecond) {
      reasons.push('SCORE_RATE_BELOW_MINIMUM');
      return { ok: false, status: 'REJECTED', reasons };
    }

    // 4. Telemetry — bot/macro detection heuristics
    if (telemetry && telemetry.length > 0) {
      // Raw-array tampering detection first: any non-monotonic timestamp in the
      // client's original event log is a forged sequence
      for (let i = 1; i < telemetry.length; i++) {
        if (telemetry[i].t <= telemetry[i - 1].t) {
          reasons.push('NON_MONOTONIC_TELEMETRY_TIMESTAMPS');
          return { ok: false, status: 'REJECTED', reasons };
        }
      }

      const sorted = [...telemetry].sort((a, b) => a.t - b.t);

      // Uniform interval detection: identical inter-event gaps indicate a script
      const gaps = new Map<number, number>();
      let uniformCount = 0;
      let minGap = Infinity;
      for (let i = 1; i < sorted.length; i++) {
        const gap = sorted[i].t - sorted[i - 1].t;
        if (gap <= 0) {
          reasons.push('NON_MONOTONIC_TELEMETRY_TIMESTAMPS');
          return { ok: false, status: 'REJECTED', reasons };
        }
        minGap = Math.min(minGap, gap);
        const count = (gaps.get(gap) ?? 0) + 1;
        gaps.set(gap, count);
        uniformCount = Math.max(uniformCount, count);
      }

      if (sorted.length >= 8 && uniformCount >= sorted.length - 1) {
        reasons.push('UNIFORM_TELEMETRY_INTERVAL_BOT_HEURISTIC');
        return { ok: false, status: 'REJECTED', reasons };
      }

      // Physical action rate: taps closer than the game's cooldown are impossible
      const minEventIntervalMs = config.antiCheat?.minEventIntervalMs;
      if (minEventIntervalMs && minGap < minEventIntervalMs) {
        reasons.push(`ACTION_RATE_EXCEEDS_PHYSICS_LIMIT (${minGap}ms < ${minEventIntervalMs}ms)`);
        return { ok: false, status: 'REJECTED', reasons };
      }

      // Telemetry must cover the reported play span
      const span = sorted[sorted.length - 1].t - sorted[0].t;
      if (durationMs > 30000 && span > 0 && span < durationMs * 0.5) {
        reasons.push('TELEMETRY_SPAN_DOES_NOT_COVER_REPORTED_DURATION');
        return { ok: false, status: 'REJECTED', reasons };
      }

      // Event/score ratio: flooding the log with meaningless events is a
      // tell-tale of scripts trying to satisfy coverage heuristics
      const maxEventsPerScore = config.antiCheat?.maxEventsPerScore;
      if (maxEventsPerScore && score > 0) {
        const ratio = sorted.length / score;
        if (ratio > maxEventsPerScore + 0.5) {
          reasons.push(`EVENT_FLOOD_HEURISTIC (${sorted.length} events / ${score} pts)`);
          return { ok: false, status: 'REJECTED', reasons };
        }
      }
    }

    // 5. Game-specific stats bounds
    if (stats) {
      const ac = config.antiCheat ?? {};
      if (stats.accuracy != null && (stats.accuracy < 0 || stats.accuracy > 100 || !Number.isInteger(stats.accuracy))) {
        reasons.push('INVALID_ACCURACY_STAT');
        return { ok: false, status: 'REJECTED', reasons };
      }
      if (stats.combo != null && (stats.combo < 0 || !Number.isInteger(stats.combo))) {
        reasons.push('INVALID_COMBO_STAT');
        return { ok: false, status: 'REJECTED', reasons };
      }
      if (stats.moves != null && (!Number.isInteger(stats.moves) || stats.moves < 0)) {
        reasons.push('INVALID_MOVES_STAT');
        return { ok: false, status: 'REJECTED', reasons };
      }
      if (stats.reactionMs != null && (stats.reactionMs < 0 || stats.reactionMs > durationMs + 5000)) {
        reasons.push('IMPLAUSIBLE_REACTION_TIME');
        return { ok: false, status: 'REJECTED', reasons };
      }
      // Power Grid: rotations are bound by the board — moves must be plausible
      if (ac.maxMovesPerLevel && stats.levelsCompleted != null && stats.moves != null) {
        const maxMoves = ac.maxMovesPerLevel * Math.max(1, stats.levelsCompleted);
        if (stats.moves > maxMoves * 2) {
          reasons.push(`MOVES_EXCEED_PUZZLE_BOUNDS (${stats.moves} > ${maxMoves * 2})`);
          return { ok: false, status: 'REJECTED', reasons };
        }
      }
      if (stats.efficiency != null && (stats.efficiency < 0 || stats.efficiency > 100)) {
        reasons.push('INVALID_EFFICIENCY_STAT');
        return { ok: false, status: 'REJECTED', reasons };
      }
    }

    return { ok: true, status: 'COMPLETED', reasons: [] };
  }

  /**
   * Whether a completed session counts as a "win" (win streak / games won).
   */
  isWin(score: number, session: GameSession, game: GameCatalog): boolean {
    const config = this.getConfig(game);
    const threshold = config.winScoreThreshold ?? 1;
    return score >= threshold && session.crystalsEarned + (session.usdtEarned?.toNumber() ?? 0) > 0;
  }

  toJson(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }
}

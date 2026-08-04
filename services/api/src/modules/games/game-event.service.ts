import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GameEvent, Prisma } from '@prisma/client';
import type { GameEventView } from './game-types';

/**
 * Seasonal / weekend event engine. Active events apply configurable multipliers
 * to crystal and USDT payouts for a specific game (gameId set) or all games
 * (gameId null). Scheduling is time-window based; events can overlap.
 */
@Injectable()
export class GameEventService {
  private readonly logger = new Logger(GameEventService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getActiveEvents(now = new Date()): Promise<GameEvent[]> {
    return this.prisma.gameEvent.findMany({
      where: {
        enabled: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { startsAt: 'desc' },
    });
  }

  async getActiveEventsView(now = new Date()): Promise<GameEventView[]> {
    const events = await this.getActiveEvents(now);
    return events.map((e) => this.toView(e, now));
  }

  async getAllEvents(): Promise<GameEventView[]> {
    const events = await this.prisma.gameEvent.findMany({
      orderBy: { startsAt: 'desc' },
    });
    const now = new Date();
    return events.map((e) => this.toView(e, now));
  }

  toView(event: GameEvent, now = new Date()): GameEventView {
    return {
      code: event.code,
      title: event.title,
      description: event.description,
      gameId: event.gameId,
      crystalMultiplier: event.crystalMultiplier,
      usdtMultiplier: event.usdtMultiplier.toString(),
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      active: event.enabled && event.startsAt <= now && event.endsAt >= now,
    };
  }

  /**
   * Resolve multipliers applicable to a game at this moment. Event bonuses are
   * multiplicative with a floor of 1x (an event never reduces payouts).
   */
  async resolveMultipliers(gameId: string, now = new Date()) {
    const events = await this.getActiveEvents(now);
    let crystalMultiplier = 1;
    let usdtMultiplier = 1;
    const applied: string[] = [];

    for (const event of events) {
      if (event.gameId && event.gameId !== gameId) continue;
      crystalMultiplier *= Math.max(1, event.crystalMultiplier);
      usdtMultiplier *= Math.max(1, event.usdtMultiplier.toNumber());
      applied.push(event.code);
    }

    return {
      crystalMultiplier: Math.floor(crystalMultiplier),
      usdtMultiplier: Number(usdtMultiplier.toFixed(6)),
      events: applied,
    };
  }

  async upsertEvent(data: {
    code: string;
    title: string;
    description: string;
    gameId?: string | null;
    crystalMultiplier?: number;
    usdtMultiplier?: string;
    startsAt: Date;
    endsAt: Date;
    enabled?: boolean;
  }) {
    return this.prisma.gameEvent.upsert({
      where: { code: data.code },
      create: {
        code: data.code,
        title: data.title,
        description: data.description,
        gameId: data.gameId ?? null,
        crystalMultiplier: data.crystalMultiplier ?? 1,
        usdtMultiplier: data.usdtMultiplier ?? '1',
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        enabled: data.enabled ?? true,
      },
      update: {
        title: data.title,
        description: data.description,
        gameId: data.gameId ?? null,
        crystalMultiplier: data.crystalMultiplier ?? undefined,
        usdtMultiplier: data.usdtMultiplier ?? undefined,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        enabled: data.enabled ?? undefined,
      },
    });
  }

  async seedDefaults() {
    const now = new Date();
    const daysUntilSaturday = (6 - now.getDay() + 7) % 7;
    const daysUntilSunday = (7 - now.getDay() + 7) % 7;
    const satStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSaturday, 0, 0, 0);
    const sunEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSunday, 23, 59, 59);

    const defaults: Array<{
      code: string;
      title: string;
      description: string;
      gameId: string | null;
      crystalMultiplier: number;
      startsAt: Date;
      endsAt: Date;
    }> = [
      {
        code: 'DOUBLE_CRYSTAL_WEEKEND',
        title: 'Double Crystal Weekend',
        description: '2x Crystals across every mini-game. Saturday to Sunday.',
        gameId: null,
        crystalMultiplier: 2,
        startsAt: satStart,
        endsAt: sunEnd,
      },
      {
        code: 'REACTOR_RUSH',
        title: 'Reactor Rush',
        description: '2x crystals in Titan Reactor — nodes overload faster, rewards bigger.',
        gameId: 'titan-core-reactor',
        crystalMultiplier: 2,
        startsAt: satStart,
        endsAt: sunEnd,
      },
      {
        code: 'GRID_MASTER',
        title: 'Grid Master',
        description: '2x crystals in Power Grid — efficiency is king this weekend.',
        gameId: 'power-grid',
        crystalMultiplier: 2,
        startsAt: satStart,
        endsAt: sunEnd,
      },
      {
        code: 'HOOPS_FRENZY',
        title: 'Basketball Frenzy',
        description: '2x crystals in Hoop Masters — shoot for the stars.',
        gameId: 'hoop-masters',
        crystalMultiplier: 2,
        startsAt: satStart,
        endsAt: sunEnd,
      },
      {
        code: 'LUCKY_ROULETTE',
        title: 'Lucky Roulette',
        description: '2x crystals in Crypto Roulette — the wheel feels lucky.',
        gameId: 'crypto-roulette',
        crystalMultiplier: 2,
        startsAt: satStart,
        endsAt: sunEnd,
      },
    ];

    for (const def of defaults) {
      if (def.endsAt <= now) continue;
      // Roll the recurring weekend window forward on every boot so the event
      // stays current across weeks
      await this.prisma.gameEvent.upsert({
        where: { code: def.code },
        update: {
          title: def.title,
          description: def.description,
          startsAt: def.startsAt,
          endsAt: def.endsAt,
          enabled: true,
        },
        create: {
          ...def,
          usdtMultiplier: '1',
        },
      });
      this.logger.log(`[GameEvent] Seeded ${def.code}`);
    }
  }

  async deleteEvent(code: string) {
    return this.prisma.gameEvent.delete({ where: { code } });
  }
}

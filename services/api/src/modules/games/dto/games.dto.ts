import { IsInt, IsOptional, IsString, Min, Max, IsBoolean, IsArray, IsObject } from 'class-validator';

export class EndSessionDto {
  @IsInt()
  @Min(0)
  score: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMs?: number;

  @IsOptional()
  @IsArray()
  telemetry?: Array<{ action: string; t: number }>;

  /** Per-game statistics (combo, accuracy, reaction, moves, efficiency...) */
  @IsOptional()
  @IsObject()
  stats?: {
    combo?: number;
    accuracy?: number;
    reactionMs?: number;
    moves?: number;
    efficiency?: number;
    levelsCompleted?: number;
    perfect?: boolean;
  };
}

export class LeaderboardQueryDto {
  @IsOptional()
  @IsString()
  gameId?: string;

  @IsOptional()
  @IsString()
  period?: 'daily' | 'weekly' | 'all';

  @IsOptional()
  @IsString()
  scope?: 'global' | 'friends';
}

export class CrystalAdminAdjustDto {
  @IsInt()
  amount: number;

  @IsString()
  reason: string;
}

export class UpsertGameEventDto {
  @IsString()
  code: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  gameId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  crystalMultiplier?: number;

  @IsOptional()
  @IsString()
  usdtMultiplier?: string;

  @IsString()
  startsAt: string;

  @IsString()
  endsAt: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpsertGameCatalogDto {
  @IsOptional()
  @IsString()
  gameId?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  crystalCost?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  dailyLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(3600)
  estimatedDurationSec?: number;

  @IsOptional()
  @IsString()
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  rewardConfig?: Record<string, unknown>;
}

export class UpsertDailyChallengeDto {
  @IsString()
  code: string;

  @IsString()
  gameId: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  objectiveType: 'SCORE_AT_LEAST' | 'FEWER_MOVES' | 'WINS' | 'PLAYS' | 'PERFECT_ACCURACY' | 'PERFECT_SESSION';

  @IsInt()
  @Min(1)
  target: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  rewardCrystals?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  rewardXp?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

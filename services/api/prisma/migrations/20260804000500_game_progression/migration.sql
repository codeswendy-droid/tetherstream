-- Game Progression: per-game player stats, reward grants, rotating daily challenges

-- Enums
CREATE TYPE "GameChallengeObjective" AS ENUM ('SCORE_AT_LEAST', 'FEWER_MOVES', 'WINS', 'PLAYS', 'PERFECT_ACCURACY', 'PERFECT_SESSION');
CREATE TYPE "GameRewardGrantType" AS ENUM ('XP', 'EVENT_POINTS', 'MYSTERY_BOX', 'MACHINE_BOOST', 'ACHIEVEMENT_PROGRESS', 'BOOST_TOKEN');

-- AlterTable: per-user progression profile gains XP + challenge counters
ALTER TABLE "game_profiles" ADD COLUMN "xp_total" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "xp_level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "challenges_completed" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: per-user per-game statistics
CREATE TABLE "game_player_stats" (
    "stat_id" TEXT NOT NULL,
    "telegram_user_id" BIGINT NOT NULL,
    "game_id" TEXT NOT NULL,
    "games_played" INTEGER NOT NULL DEFAULT 0,
    "games_won" INTEGER NOT NULL DEFAULT 0,
    "highest_score" INTEGER NOT NULL DEFAULT 0,
    "best_combo" INTEGER NOT NULL DEFAULT 0,
    "best_accuracy" INTEGER NOT NULL DEFAULT 0,
    "best_reaction_ms" INTEGER NOT NULL DEFAULT 0,
    "best_moves" INTEGER NOT NULL DEFAULT 0,
    "best_time_ms" INTEGER NOT NULL DEFAULT 0,
    "best_efficiency" INTEGER NOT NULL DEFAULT 0,
    "levels_completed" INTEGER NOT NULL DEFAULT 0,
    "perfect_sessions" INTEGER NOT NULL DEFAULT 0,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "last_played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_player_stats_pkey" PRIMARY KEY ("stat_id")
);

-- CreateTable: non-currency reward grants (XP, event points, boxes, boost tokens)
CREATE TABLE "game_reward_grants" (
    "grant_id" TEXT NOT NULL,
    "telegram_user_id" BIGINT NOT NULL,
    "game_id" TEXT NOT NULL,
    "session_id" TEXT,
    "type" "GameRewardGrantType" NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "reference" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_reward_grants_pkey" PRIMARY KEY ("grant_id")
);

-- CreateTable: rotating daily challenge definitions
CREATE TABLE "game_daily_challenges" (
    "challenge_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objective_type" "GameChallengeObjective" NOT NULL,
    "target" INTEGER NOT NULL,
    "reward_crystals" INTEGER NOT NULL DEFAULT 20,
    "reward_xp" INTEGER NOT NULL DEFAULT 25,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_daily_challenges_pkey" PRIMARY KEY ("challenge_id")
);

-- CreateTable: per-user daily challenge completions (idempotent per day)
CREATE TABLE "game_challenge_completions" (
    "completion_id" TEXT NOT NULL,
    "telegram_user_id" BIGINT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "challenge_day" TIMESTAMP(3) NOT NULL,
    "session_id" TEXT NOT NULL,
    "reward_crystals" INTEGER NOT NULL DEFAULT 0,
    "reward_xp" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_challenge_completions_pkey" PRIMARY KEY ("completion_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_player_stats_telegram_user_id_game_id_key" ON "game_player_stats"("telegram_user_id", "game_id");

-- CreateIndex
CREATE INDEX "game_player_stats_game_id_highest_score_idx" ON "game_player_stats"("game_id", "highest_score");

-- CreateIndex
CREATE INDEX "game_reward_grants_telegram_user_id_created_at_idx" ON "game_reward_grants"("telegram_user_id", "created_at");

-- CreateIndex
CREATE INDEX "game_reward_grants_type_idx" ON "game_reward_grants"("type");

-- CreateIndex
CREATE UNIQUE INDEX "game_reward_grants_reference_key" ON "game_reward_grants"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "game_daily_challenges_code_key" ON "game_daily_challenges"("code");

-- CreateIndex
CREATE INDEX "game_daily_challenges_enabled_idx" ON "game_daily_challenges"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "game_challenge_completions_telegram_user_id_challenge_id_cha_key" ON "game_challenge_completions"("telegram_user_id", "challenge_id", "challenge_day");

-- AddForeignKey
ALTER TABLE "game_player_stats" ADD CONSTRAINT "game_player_stats_telegram_user_id_fkey" FOREIGN KEY ("telegram_user_id") REFERENCES "users"("telegram_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_player_stats" ADD CONSTRAINT "game_player_stats_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game_catalog"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_reward_grants" ADD CONSTRAINT "game_reward_grants_telegram_user_id_fkey" FOREIGN KEY ("telegram_user_id") REFERENCES "users"("telegram_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_daily_challenges" ADD CONSTRAINT "game_daily_challenges_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game_catalog"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_challenge_completions" ADD CONSTRAINT "game_challenge_completions_telegram_user_id_fkey" FOREIGN KEY ("telegram_user_id") REFERENCES "users"("telegram_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_challenge_completions" ADD CONSTRAINT "game_challenge_completions_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "game_daily_challenges"("challenge_id") ON DELETE RESTRICT ON UPDATE CASCADE;

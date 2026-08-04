-- Game Economy: closed-loop crystal ledger + server-authoritative game sessions

-- Enums
CREATE TYPE "CrystalTransactionType" AS ENUM ('DAILY_LOGIN', 'GAME_ENTRY', 'GAME_REWARD', 'MACHINE_BONUS', 'ACHIEVEMENT', 'EVENT_BONUS', 'MYSTERY_CHEST', 'BOOST', 'COSMETIC', 'TOURNAMENT', 'RETRY', 'PURCHASE', 'ADMIN_ADJUSTMENT', 'REVERSAL');
CREATE TYPE "GameSessionStatus" AS ENUM ('STARTED', 'COMPLETED', 'REJECTED', 'VOID', 'EXPIRED');
CREATE TYPE "GameDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

-- CreateTable
CREATE TABLE "crystal_accounts" (
    "account_id" TEXT NOT NULL,
    "telegram_user_id" BIGINT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lifetime_earned" INTEGER NOT NULL DEFAULT 0,
    "lifetime_spent" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crystal_accounts_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "crystal_transactions" (
    "tx_id" TEXT NOT NULL,
    "telegram_user_id" BIGINT NOT NULL,
    "account_id" TEXT NOT NULL,
    "tx_type" "CrystalTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crystal_transactions_pkey" PRIMARY KEY ("tx_id")
);

-- CreateTable
CREATE TABLE "game_catalog" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🎮',
    "accent_color" TEXT NOT NULL DEFAULT '#00e676',
    "crystal_cost" INTEGER NOT NULL DEFAULT 5,
    "daily_limit" INTEGER NOT NULL DEFAULT 10,
    "estimated_duration_sec" INTEGER NOT NULL DEFAULT 60,
    "difficulty" "GameDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "reward_config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_sessions" (
    "session_id" TEXT NOT NULL,
    "telegram_user_id" BIGINT NOT NULL,
    "game_id" TEXT NOT NULL,
    "status" "GameSessionStatus" NOT NULL DEFAULT 'STARTED',
    "crystal_cost" INTEGER NOT NULL,
    "server_started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "server_ended_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "score" INTEGER NOT NULL DEFAULT 0,
    "crystals_earned" INTEGER NOT NULL DEFAULT 0,
    "usdt_earned" DECIMAL(36,18),
    "validation" JSONB,
    "reference" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "game_profiles" (
    "telegram_user_id" BIGINT NOT NULL,
    "highest_score" INTEGER NOT NULL DEFAULT 0,
    "games_played" INTEGER NOT NULL DEFAULT 0,
    "games_won" INTEGER NOT NULL DEFAULT 0,
    "win_streak" INTEGER NOT NULL DEFAULT 0,
    "best_win_streak" INTEGER NOT NULL DEFAULT 0,
    "daily_streak" INTEGER NOT NULL DEFAULT 0,
    "total_crystals_earned" INTEGER NOT NULL DEFAULT 0,
    "total_crystals_spent" INTEGER NOT NULL DEFAULT 0,
    "last_played_at" TIMESTAMP(3),
    "last_daily_claim_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_profiles_pkey" PRIMARY KEY ("telegram_user_id")
);

-- CreateTable
CREATE TABLE "game_events" (
    "event_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "game_id" TEXT,
    "crystal_multiplier" INTEGER NOT NULL DEFAULT 1,
    "usdt_multiplier" DECIMAL(36,18) NOT NULL DEFAULT 1,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crystal_accounts_telegram_user_id_key" ON "crystal_accounts"("telegram_user_id");

-- CreateIndex
CREATE INDEX "crystal_transactions_telegram_user_id_created_at_idx" ON "crystal_transactions"("telegram_user_id", "created_at");

-- CreateIndex
CREATE INDEX "crystal_transactions_tx_type_idx" ON "crystal_transactions"("tx_type");

-- CreateIndex
CREATE UNIQUE INDEX "crystal_transactions_reference_key" ON "crystal_transactions"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "game_catalog_game_id_key" ON "game_catalog"("game_id");

-- CreateIndex
CREATE INDEX "game_sessions_telegram_user_id_created_at_idx" ON "game_sessions"("telegram_user_id", "created_at");

-- CreateIndex
CREATE INDEX "game_sessions_game_id_created_at_idx" ON "game_sessions"("game_id", "created_at");

-- CreateIndex
CREATE INDEX "game_sessions_telegram_user_id_game_id_created_at_idx" ON "game_sessions"("telegram_user_id", "game_id", "created_at");

-- CreateIndex
CREATE INDEX "game_sessions_created_at_idx" ON "game_sessions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "game_sessions_reference_key" ON "game_sessions"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "game_events_code_key" ON "game_events"("code");

-- CreateIndex
CREATE INDEX "game_events_enabled_starts_at_ends_at_idx" ON "game_events"("enabled", "starts_at", "ends_at");

-- AddForeignKey
ALTER TABLE "crystal_accounts" ADD CONSTRAINT "crystal_accounts_telegram_user_id_fkey" FOREIGN KEY ("telegram_user_id") REFERENCES "users"("telegram_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crystal_transactions" ADD CONSTRAINT "crystal_transactions_telegram_user_id_fkey" FOREIGN KEY ("telegram_user_id") REFERENCES "users"("telegram_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crystal_transactions" ADD CONSTRAINT "crystal_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "crystal_accounts"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_telegram_user_id_fkey" FOREIGN KEY ("telegram_user_id") REFERENCES "users"("telegram_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game_catalog"("game_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_profiles" ADD CONSTRAINT "game_profiles_telegram_user_id_fkey" FOREIGN KEY ("telegram_user_id") REFERENCES "users"("telegram_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_events" ADD CONSTRAINT "game_events_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game_catalog"("game_id") ON DELETE SET NULL ON UPDATE CASCADE;

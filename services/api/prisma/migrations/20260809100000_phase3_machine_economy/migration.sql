-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('ACTIVE', 'DISABLED', 'ARCHIVED', 'MAINTENANCE');
CREATE TYPE "MachineOutputStatus" AS ENUM ('ENABLED', 'DISABLED', 'LOCKED', 'ARCHIVED');

-- CreateTable machine_catalog_items
CREATE TABLE IF NOT EXISTS "machine_catalog_items" (
    "machine_id" TEXT NOT NULL,
    "tier_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'STANDARD',
    "price_usdt" DECIMAL(36,18) NOT NULL,
    "purchase_currency" TEXT NOT NULL DEFAULT 'USDT',
    "capacity_ghs" DECIMAL(36,18) NOT NULL,
    "daily_yield_estimate_usdt" DECIMAL(36,18) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "MachineStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "icon" TEXT,
    "artwork" TEXT,
    "theme" TEXT,
    "upgrade_path" TEXT,
    "available_from" TIMESTAMP(3),
    "available_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machine_catalog_items_pkey" PRIMARY KEY ("machine_id")
);

-- CreateTable machine_output_streams
CREATE TABLE IF NOT EXISTS "machine_output_streams" (
    "output_id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "asset_code" TEXT NOT NULL,
    "base_yield_rate" DECIMAL(36,18) NOT NULL,
    "yield_unit" TEXT NOT NULL DEFAULT 'PER_SECOND',
    "multiplier" DECIMAL(36,18) NOT NULL DEFAULT 1.0,
    "decay_profile" TEXT NOT NULL DEFAULT 'STANDARD',
    "minimum_license" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "MachineOutputStatus" NOT NULL DEFAULT 'ENABLED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machine_output_streams_pkey" PRIMARY KEY ("output_id")
);

-- CreateTable user_machine_fleet
CREATE TABLE IF NOT EXISTS "user_machine_fleet" (
    "fleet_item_id" TEXT NOT NULL,
    "telegram_user_id" BIGINT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "tier_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purchase_price" DECIMAL(36,18) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDT',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "capacity_ghs" DECIMAL(36,18) NOT NULL,
    "lifetime_earnings" DECIMAL(36,18) NOT NULL DEFAULT 0,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_machine_fleet_pkey" PRIMARY KEY ("fleet_item_id")
);

-- CreateTable machine_timeline_events
CREATE TABLE IF NOT EXISTS "machine_timeline_events" (
    "timeline_event_id" TEXT NOT NULL,
    "machine_id" TEXT,
    "fleet_item_id" TEXT,
    "event_type" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL DEFAULT 'SYSTEM',
    "actor_id" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_timeline_events_pkey" PRIMARY KEY ("timeline_event_id")
);

-- CreateTable economy_profiles
CREATE TABLE IF NOT EXISTS "economy_profiles" (
    "profile_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "yield_multiplier" DECIMAL(36,18) NOT NULL DEFAULT 1.0,
    "referral_multiplier" DECIMAL(36,18) NOT NULL DEFAULT 1.0,
    "reward_multiplier" DECIMAL(36,18) NOT NULL DEFAULT 1.0,
    "decay_rules" JSONB NOT NULL DEFAULT '{}',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "economy_profiles_pkey" PRIMARY KEY ("profile_id")
);

-- CreateTable promotion_campaigns
CREATE TABLE IF NOT EXISTS "promotion_campaigns" (
    "campaign_id" TEXT NOT NULL,
    "campaign_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discount_pct" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "yield_boost_mult" DECIMAL(36,18) NOT NULL DEFAULT 1.0,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_campaigns_pkey" PRIMARY KEY ("campaign_id")
);

-- CreateTable maintenance_windows
CREATE TABLE IF NOT EXISTS "maintenance_windows" (
    "window_id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "target_id" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'NO_CLAIMS',
    "custom_message" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_windows_pkey" PRIMARY KEY ("window_id")
);

-- CreateIndexes
CREATE UNIQUE INDEX IF NOT EXISTS "machine_catalog_items_tier_code_key" ON "machine_catalog_items"("tier_code");
CREATE INDEX IF NOT EXISTS "machine_catalog_items_status_idx" ON "machine_catalog_items"("status");
CREATE INDEX IF NOT EXISTS "machine_catalog_items_display_order_idx" ON "machine_catalog_items"("display_order");

CREATE UNIQUE INDEX IF NOT EXISTS "machine_output_streams_machine_id_asset_code_key" ON "machine_output_streams"("machine_id", "asset_code");
CREATE INDEX IF NOT EXISTS "machine_output_streams_machine_id_idx" ON "machine_output_streams"("machine_id");
CREATE INDEX IF NOT EXISTS "machine_output_streams_asset_code_idx" ON "machine_output_streams"("asset_code");
CREATE INDEX IF NOT EXISTS "machine_output_streams_status_idx" ON "machine_output_streams"("status");

CREATE INDEX IF NOT EXISTS "user_machine_fleet_telegram_user_id_idx" ON "user_machine_fleet"("telegram_user_id");
CREATE INDEX IF NOT EXISTS "user_machine_fleet_machine_id_idx" ON "user_machine_fleet"("machine_id");
CREATE INDEX IF NOT EXISTS "user_machine_fleet_status_idx" ON "user_machine_fleet"("status");

CREATE INDEX IF NOT EXISTS "machine_timeline_events_machine_id_idx" ON "machine_timeline_events"("machine_id");
CREATE INDEX IF NOT EXISTS "machine_timeline_events_fleet_item_id_idx" ON "machine_timeline_events"("fleet_item_id");
CREATE INDEX IF NOT EXISTS "machine_timeline_events_event_type_idx" ON "machine_timeline_events"("event_type");
CREATE INDEX IF NOT EXISTS "machine_timeline_events_created_at_idx" ON "machine_timeline_events"("created_at");

CREATE UNIQUE INDEX IF NOT EXISTS "economy_profiles_code_key" ON "economy_profiles"("code");
CREATE INDEX IF NOT EXISTS "economy_profiles_code_idx" ON "economy_profiles"("code");
CREATE INDEX IF NOT EXISTS "economy_profiles_is_active_idx" ON "economy_profiles"("is_active");

CREATE UNIQUE INDEX IF NOT EXISTS "promotion_campaigns_campaign_code_key" ON "promotion_campaigns"("campaign_code");
CREATE INDEX IF NOT EXISTS "promotion_campaigns_campaign_code_idx" ON "promotion_campaigns"("campaign_code");
CREATE INDEX IF NOT EXISTS "promotion_campaigns_status_starts_at_ends_at_idx" ON "promotion_campaigns"("status", "starts_at", "ends_at");

CREATE INDEX IF NOT EXISTS "maintenance_windows_scope_target_id_idx" ON "maintenance_windows"("scope", "target_id");
CREATE INDEX IF NOT EXISTS "maintenance_windows_is_active_starts_at_ends_at_idx" ON "maintenance_windows"("is_active", "starts_at", "ends_at");

-- AddForeignKey constraints with ON DELETE RESTRICT
ALTER TABLE "machine_output_streams" DROP CONSTRAINT IF EXISTS "machine_output_streams_machine_id_fkey";
ALTER TABLE "machine_output_streams" ADD CONSTRAINT "machine_output_streams_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machine_catalog_items"("machine_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_machine_fleet" DROP CONSTRAINT IF EXISTS "user_machine_fleet_telegram_user_id_fkey";
ALTER TABLE "user_machine_fleet" ADD CONSTRAINT "user_machine_fleet_telegram_user_id_fkey" FOREIGN KEY ("telegram_user_id") REFERENCES "users"("telegram_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_machine_fleet" DROP CONSTRAINT IF EXISTS "user_machine_fleet_machine_id_fkey";
ALTER TABLE "user_machine_fleet" ADD CONSTRAINT "user_machine_fleet_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machine_catalog_items"("machine_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "machine_timeline_events" DROP CONSTRAINT IF EXISTS "machine_timeline_events_machine_id_fkey";
ALTER TABLE "machine_timeline_events" ADD CONSTRAINT "machine_timeline_events_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machine_catalog_items"("machine_id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "machine_timeline_events" DROP CONSTRAINT IF EXISTS "machine_timeline_events_fleet_item_id_fkey";
ALTER TABLE "machine_timeline_events" ADD CONSTRAINT "machine_timeline_events_fleet_item_id_fkey" FOREIGN KEY ("fleet_item_id") REFERENCES "user_machine_fleet"("fleet_item_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable platform_operational_configs
CREATE TABLE IF NOT EXISTS "platform_operational_configs" (
    "config_id" TEXT NOT NULL DEFAULT 'AUTHORITATIVE_PLATFORM_CONFIG',
    "version" INTEGER NOT NULL DEFAULT 1,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "read_only_mode" BOOLEAN NOT NULL DEFAULT false,
    "disable_registrations" BOOLEAN NOT NULL DEFAULT false,
    "disable_purchases" BOOLEAN NOT NULL DEFAULT false,
    "disable_withdrawals" BOOLEAN NOT NULL DEFAULT false,
    "disable_claims" BOOLEAN NOT NULL DEFAULT false,
    "disable_settlements" BOOLEAN NOT NULL DEFAULT false,
    "disabled_assets" JSONB NOT NULL DEFAULT '[]',
    "disabled_machine_categories" JSONB NOT NULL DEFAULT '[]',
    "reason" TEXT NOT NULL DEFAULT 'INITIAL_BOOTSTRAP',
    "updated_by" TEXT NOT NULL DEFAULT 'SYSTEM',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_operational_configs_pkey" PRIMARY KEY ("config_id")
);

-- Migration: Add Asset License System
-- This migration adds the multi-asset license system to separate machine ownership from asset entitlement

-- Add new enums (PostgreSQL doesn't support enum changes in transactions, so we handle separately)
-- Note: These will be handled by Prisma migration

-- Create user_asset_licenses table
CREATE TABLE IF NOT EXISTS user_asset_licenses (
  license_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL,
  asset VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  license_type VARCHAR(20) NOT NULL DEFAULT 'PURCHASED',
  activated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  granted_by VARCHAR(255),
  purchase_transaction_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_user_asset UNIQUE (telegram_user_id, asset)
);

-- Create indexes for user_asset_licenses
CREATE INDEX IF NOT EXISTS idx_user_asset_licenses_user ON user_asset_licenses(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_user_asset_licenses_asset ON user_asset_licenses(asset);
CREATE INDEX IF NOT EXISTS idx_user_asset_licenses_status ON user_asset_licenses(status);
CREATE INDEX IF NOT EXISTS idx_user_asset_licenses_expires ON user_asset_licenses(expires_at);

-- Create machine_outputs table
CREATE TABLE IF NOT EXISTS machine_outputs (
  output_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_machine_id UUID NOT NULL,
  asset VARCHAR(50) NOT NULL,
  daily_rate DECIMAL(36, 18) NOT NULL,
  multiplier DECIMAL(36, 18) NOT NULL DEFAULT 1.0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_machine_asset UNIQUE (user_machine_id, asset)
);

-- Create indexes for machine_outputs
CREATE INDEX IF NOT EXISTS idx_machine_outputs_machine ON machine_outputs(user_machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_outputs_asset ON machine_outputs(asset);
CREATE INDEX IF NOT EXISTS idx_machine_outputs_enabled ON machine_outputs(enabled);

-- Add foreign key for machine_outputs
ALTER TABLE machine_outputs 
ADD CONSTRAINT fk_machine_outputs_user_machine 
FOREIGN KEY (user_machine_id) REFERENCES user_machines(user_machine_id) ON DELETE CASCADE;

-- Add foreign key for user_asset_licenses
ALTER TABLE user_asset_licenses 
ADD CONSTRAINT fk_user_asset_licenses_user 
FOREIGN KEY (telegram_user_id) REFERENCES users(telegram_user_id) ON DELETE CASCADE;

-- Update assets table with new columns
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS icon VARCHAR(255),
ADD COLUMN IF NOT EXISTS color VARCHAR(50),
ADD COLUMN IF NOT EXISTS network VARCHAR(100),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create asset_balances table
CREATE TABLE IF NOT EXISTS asset_balances (
  balance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL,
  asset VARCHAR(50) NOT NULL,
  available_balance DECIMAL(36, 18) NOT NULL DEFAULT 0,
  locked_balance DECIMAL(36, 18) NOT NULL DEFAULT 0,
  total_earned DECIMAL(36, 18) NOT NULL DEFAULT 0,
  last_claimed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_user_asset_balance UNIQUE (telegram_user_id, asset)
);

-- Create indexes for asset_balances
CREATE INDEX IF NOT EXISTS idx_asset_balances_user ON asset_balances(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_asset_balances_asset ON asset_balances(asset);

-- Add foreign key for asset_balances
ALTER TABLE asset_balances 
ADD CONSTRAINT fk_asset_balances_asset 
FOREIGN KEY (asset) REFERENCES assets(asset_code) ON DELETE CASCADE;

-- Add relation to User model (handled by Prisma)
-- This is for documentation purposes - the actual relation is added in the Prisma schema

-- Migration for existing users: Grant USDT license to all existing users
-- This ensures existing users maintain their USDT mining capability
INSERT INTO user_asset_licenses (telegram_user_id, asset, status, license_type, granted_by)
SELECT 
  telegram_user_id, 
  'USDT', 
  'ACTIVE', 
  'ADMIN_GRANTED', 
  'SYSTEM_MIGRATION'
FROM users 
WHERE telegram_user_id NOT IN (
  SELECT telegram_user_id FROM user_asset_licenses WHERE asset = 'USDT'
);

-- Initialize USDT balance for existing users
INSERT INTO asset_balances (telegram_user_id, asset, available_balance, total_earned)
SELECT 
  u.telegram_user_id,
  'USDT',
  COALESCE(
    (SELECT SUM(lifetime_earnings) FROM user_machines WHERE telegram_user_id = u.telegram_user_id),
    0
  ),
  COALESCE(
    (SELECT SUM(lifetime_earnings) FROM user_machines WHERE telegram_user_id = u.telegram_user_id),
    0
  )
FROM users u
WHERE u.telegram_user_id NOT IN (
  SELECT telegram_user_id FROM asset_balances WHERE asset = 'USDT'
);

-- Create default machine outputs for existing machines (USDT only initially)
-- This ensures existing machines continue to produce USDT
INSERT INTO machine_outputs (user_machine_id, asset, daily_rate, multiplier, enabled, display_order)
SELECT 
  um.user_machine_id,
  'USDT',
  (um.capacity_ghs * 0.00001)::DECIMAL(36, 18), -- Default USDT rate calculation
  1.0,
  TRUE,
  0
FROM user_machines um
WHERE um.user_machine_id NOT IN (
  SELECT user_machine_id FROM machine_outputs WHERE asset = 'USDT'
);

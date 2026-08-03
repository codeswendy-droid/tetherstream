-- Add the new reward claim lifecycle statuses.
-- Split from the data remap into a separate migration: PostgreSQL does not
-- allow a value added by ALTER TYPE to be used within the same transaction.
ALTER TYPE "RewardStatus" ADD VALUE IF NOT EXISTS 'AVAILABLE';
ALTER TYPE "RewardStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE "RewardStatus" ADD VALUE IF NOT EXISTS 'CLAIM_PENDING';
ALTER TYPE "RewardStatus" ADD VALUE IF NOT EXISTS 'CLAIMED';
ALTER TYPE "RewardStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

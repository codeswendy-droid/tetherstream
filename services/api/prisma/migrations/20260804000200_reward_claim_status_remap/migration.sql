-- Map legacy reward states onto the new claim lifecycle.
-- PROCESSED (already disbursed) -> CLAIMED
-- PENDING / APPROVED (never disbursed) -> AVAILABLE (user can claim)
-- CANCELLED -> EXPIRED
UPDATE "rewards" SET "status" = 'CLAIMED' WHERE "status" = 'PROCESSED';
UPDATE "rewards" SET "status" = 'AVAILABLE' WHERE "status" IN ('PENDING', 'APPROVED');
UPDATE "rewards" SET "status" = 'EXPIRED' WHERE "status" = 'CANCELLED';

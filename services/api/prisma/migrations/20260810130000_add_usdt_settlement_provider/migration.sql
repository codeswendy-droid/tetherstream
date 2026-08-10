-- AlterEnum
ALTER TYPE "SettlementProviderId" ADD VALUE 'USDT';

-- CreateEnum
CREATE TYPE "UsdtTxProcessingStatus" AS ENUM ('DETECTED', 'CONFIRMING', 'CONFIRMED', 'MATCHED', 'VERIFYING', 'PENDING_ADMIN_APPROVAL', 'SETTLED', 'DUPLICATE', 'UNDERPAYMENT', 'OVERPAYMENT', 'AMBIGUOUS_MATCH', 'INVALID_TOKEN', 'INVALID_NETWORK', 'INVALID_RECIPIENT', 'FAILED', 'RECONCILIATION_REQUIRED');

-- CreateTable
CREATE TABLE "usdt_configs" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "network" TEXT NOT NULL DEFAULT 'TRON',
    "token_contract" TEXT NOT NULL DEFAULT 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    "receiving_address" TEXT NOT NULL,
    "required_confirmations" INTEGER NOT NULL DEFAULT 19,
    "poll_interval_seconds" INTEGER NOT NULL DEFAULT 10,
    "last_scanned_block" BIGINT NOT NULL DEFAULT 0,
    "last_scan_at" TIMESTAMP(3),
    "configured_by_admin_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usdt_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usdt_address_histories" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "token_contract" TEXT NOT NULL,
    "configured_by_admin_id" TEXT,
    "activated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivated_at" TIMESTAMP(3),
    "reason" TEXT,

    CONSTRAINT "usdt_address_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usdt_blockchain_transactions" (
    "id" TEXT NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "token_contract" TEXT NOT NULL,
    "block_number" BIGINT NOT NULL,
    "block_timestamp" TIMESTAMP(3) NOT NULL,
    "sender_address" TEXT NOT NULL,
    "recipient_address" TEXT NOT NULL,
    "raw_token_amount" TEXT NOT NULL,
    "normalized_amount" DECIMAL(36,18) NOT NULL,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "on_chain_status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "processing_status" "UsdtTxProcessingStatus" NOT NULL DEFAULT 'DETECTED',
    "anomaly_reason" TEXT,
    "first_observed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_observed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalized_at" TIMESTAMP(3),
    "settlement_session_id" TEXT,
    "orchestrator_reference" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usdt_blockchain_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usdt_address_histories_address_idx" ON "usdt_address_histories"("address");
CREATE INDEX "usdt_address_histories_network_idx" ON "usdt_address_histories"("network");

-- CreateIndex
CREATE UNIQUE INDEX "usdt_blockchain_transactions_network_token_contract_transa_key" ON "usdt_blockchain_transactions"("network", "token_contract", "transaction_hash");
CREATE INDEX "usdt_blockchain_transactions_transaction_hash_idx" ON "usdt_blockchain_transactions"("transaction_hash");
CREATE INDEX "usdt_blockchain_transactions_recipient_address_idx" ON "usdt_blockchain_transactions"("recipient_address");
CREATE INDEX "usdt_blockchain_transactions_sender_address_idx" ON "usdt_blockchain_transactions"("sender_address");
CREATE INDEX "usdt_blockchain_transactions_processing_status_idx" ON "usdt_blockchain_transactions"("processing_status");
CREATE INDEX "usdt_blockchain_transactions_settlement_session_id_idx" ON "usdt_blockchain_transactions"("settlement_session_id");

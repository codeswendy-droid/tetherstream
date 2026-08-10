import { UsdtTxProcessingStatus } from '@prisma/client';

export interface UsdtConfigView {
  id: string;
  enabled: boolean;
  network: string; // "TRON" or "TRON_NILE"
  tokenContract: string; // Canonical USDT contract
  receivingAddress: string;
  requiredConfirmations: number;
  pollIntervalSeconds: number;
  lastScannedBlock: string;
  lastScanAt: Date | null;
  configuredByAdminId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsdtTokenTransferEvent {
  transactionHash: string;
  network: string;
  tokenContract: string;
  blockNumber: bigint;
  blockTimestamp: Date;
  senderAddress: string;
  recipientAddress: string;
  rawTokenAmount: string; // e.g. "10000000" (6 decimals)
  normalizedAmount: string; // "10.000000"
  confirmations: number;
  onChainStatus: string; // "SUCCESS"
}

export interface UsdtScannerHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNCONFIGURED';
  enabled: boolean;
  network: string;
  tokenContract: string;
  receivingAddress: string | null;
  requiredConfirmations: number;
  lastScannedBlock: string;
  latestBlock: string;
  blockLag: number;
  lastScanAt: Date | null;
  errorMessage?: string;
}

export interface UsdtDepositMatchResult {
  matched: boolean;
  status: UsdtTxProcessingStatus;
  settlementSessionId?: string;
  anomalyReason?: string;
}

export const CANONICAL_USDT_CONTRACTS: Record<string, string> = {
  TRON: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  TRON_MAINNET: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  TRON_NILE: 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf',
  TRON_SHASTA: 'TG3XXySZAu2kMrm2n3wiXY5nHW2CD2iEXB',
};

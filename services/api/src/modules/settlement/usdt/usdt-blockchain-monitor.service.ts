import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, UsdtTxProcessingStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { UsdtBlockchainClient } from './usdt-blockchain.client';
import { UsdtDepositMatchingService } from './usdt.deposit-matching.service';
import { UsdtProvider } from './usdt.provider';
import { CANONICAL_USDT_CONTRACTS, UsdtScannerHealth } from './usdt.types';

@Injectable()
export class UsdtBlockchainMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UsdtBlockchainMonitorService.name);
  private isRunning = false;
  private timerHandle?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly client: UsdtBlockchainClient,
    private readonly matcher: UsdtDepositMatchingService,
    private readonly provider: UsdtProvider,
  ) {}

  onModuleInit() {
    this.startScanner();
  }

  onModuleDestroy() {
    this.stopScanner();
  }

  startScanner() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.logger.log('[UsdtBlockchainMonitor] Initialized USDT TRC-20 blockchain scanner worker');
    this.scheduleNextScan(1000);
  }

  stopScanner() {
    this.isRunning = false;
    if (this.timerHandle) clearTimeout(this.timerHandle);
    this.logger.log('[UsdtBlockchainMonitor] Stopped USDT scanner worker');
  }

  private scheduleNextScan(delayMs: number) {
    if (!this.isRunning) return;
    this.timerHandle = setTimeout(() => {
      this.scanLoop()
        .catch((err) => this.logger.error(`[UsdtBlockchainMonitor] Scan loop error: ${err?.message}`))
        .finally(() => {
          this.scheduleNextScan(10000);
        });
    }, delayMs);
  }

  /**
   * Main scan loop.
   */
  async scanLoop(): Promise<void> {
    const config = await this.prisma.usdtConfig.findUnique({ where: { id: 'default' } });
    if (!config || !config.enabled || !config.receivingAddress) {
      return;
    }

    const network = config.network || 'TRON';
    const tokenContract = config.tokenContract || CANONICAL_USDT_CONTRACTS[network] || CANONICAL_USDT_CONTRACTS.TRON;

    // 1. Fetch latest transfers to receivingAddress
    const transfers = await this.client.getTrc20Transfers(
      config.receivingAddress,
      network,
      tokenContract,
      50,
    );

    let maxObservedBlock = config.lastScannedBlock;

    for (const tx of transfers) {
      if (tx.blockNumber > maxObservedBlock) {
        maxObservedBlock = tx.blockNumber;
      }

      // 2. Persist observation atomically (restart-safe & duplicate-proof)
      const normAmount = new Prisma.Decimal(tx.normalizedAmount);

      const dbTx = await this.prisma.usdtBlockchainTransaction.upsert({
        where: {
          usdt_tx_unique: {
            network: tx.network,
            tokenContract: tx.tokenContract,
            transactionHash: tx.transactionHash,
          },
        },
        update: {
          confirmations: tx.confirmations,
          lastObservedAt: new Date(),
        },
        create: {
          transactionHash: tx.transactionHash,
          network: tx.network,
          tokenContract: tx.tokenContract,
          blockNumber: tx.blockNumber,
          blockTimestamp: tx.blockTimestamp,
          senderAddress: tx.senderAddress,
          recipientAddress: tx.recipientAddress,
          rawTokenAmount: tx.rawTokenAmount,
          normalizedAmount: normAmount,
          confirmations: tx.confirmations,
          onChainStatus: tx.onChainStatus,
          processingStatus: UsdtTxProcessingStatus.DETECTED,
        },
      });

      // Skip processing if already finalized/settled
      if (dbTx.processingStatus === UsdtTxProcessingStatus.SETTLED || dbTx.processingStatus === UsdtTxProcessingStatus.DUPLICATE) {
        continue;
      }

      // 3. Match against active SettlementSessions
      const matchResult = await this.matcher.matchTransaction(
        tx,
        config.receivingAddress,
        tokenContract,
        config.requiredConfirmations,
      );

      // 4. Update status in database
      await this.prisma.usdtBlockchainTransaction.update({
        where: { id: dbTx.id },
        data: {
          processingStatus: matchResult.status,
          anomalyReason: matchResult.anomalyReason || null,
          settlementSessionId: matchResult.matchedSessionId || null,
        },
      });

      // 5. Trigger financial settlement if match is clean & confirmed
      if (matchResult.status === UsdtTxProcessingStatus.MATCHED && matchResult.matchedSessionId) {
        try {
          this.logger.log(`[UsdtBlockchainMonitor] Triggering financial settlement for matched session ${matchResult.matchedSessionId} (txHash: ${tx.transactionHash})`);
          
          await this.provider.approveSettlement(matchResult.matchedSessionId, {
            txHash: tx.transactionHash,
            blockNumber: tx.blockNumber.toString(),
            confirmations: tx.confirmations,
            senderAddress: tx.senderAddress,
            rawTokenAmount: tx.rawTokenAmount,
          });

          // Mark transaction SETTLED
          await this.prisma.usdtBlockchainTransaction.update({
            where: { id: dbTx.id },
            data: {
              processingStatus: UsdtTxProcessingStatus.SETTLED,
              finalizedAt: new Date(),
            },
          });
        } catch (err: any) {
          this.logger.error(`[UsdtBlockchainMonitor] Settlement approval error: ${err?.message}`);
          await this.prisma.usdtBlockchainTransaction.update({
            where: { id: dbTx.id },
            data: {
              processingStatus: UsdtTxProcessingStatus.RECONCILIATION_REQUIRED,
              anomalyReason: `Settlement execution error: ${err?.message}`,
            },
          });
        }
      }
    }

    // 6. Update last scanned block & scan time
    await this.prisma.usdtConfig.update({
      where: { id: 'default' },
      data: {
        lastScannedBlock: maxObservedBlock,
        lastScanAt: new Date(),
      },
    });
  }

  /**
   * Health status inspection for admin monitoring.
   */
  async getScannerHealth(): Promise<UsdtScannerHealth> {
    const config = await this.prisma.usdtConfig.findUnique({ where: { id: 'default' } });
    if (!config) {
      return {
        status: 'UNCONFIGURED',
        enabled: false,
        network: 'TRON',
        tokenContract: '',
        receivingAddress: null,
        requiredConfirmations: 19,
        lastScannedBlock: '0',
        latestBlock: '0',
        blockLag: 0,
        lastScanAt: null,
      };
    }

    const latestBlock = await this.client.getLatestBlockNumber(config.network);
    const lastScanned = config.lastScannedBlock;
    const blockLag = Number(latestBlock >= lastScanned ? latestBlock - lastScanned : 0n);

    let status: UsdtScannerHealth['status'] = 'HEALTHY';
    if (!config.enabled) status = 'DOWN';
    else if (blockLag > 50) status = 'DEGRADED';

    return {
      status,
      enabled: config.enabled,
      network: config.network,
      tokenContract: config.tokenContract,
      receivingAddress: config.receivingAddress,
      requiredConfirmations: config.requiredConfirmations,
      lastScannedBlock: lastScanned.toString(),
      latestBlock: latestBlock.toString(),
      blockLag,
      lastScanAt: config.lastScanAt,
    };
  }
}

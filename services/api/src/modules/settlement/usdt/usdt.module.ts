import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../database/prisma.module';
import { FinancialOrchestrationModule } from '../../financial-orchestration/financial-orchestration.module';
import { ProviderEventService } from '../provider-event.service';
import { SettlementRiskService } from '../settlement-risk.service';
import { UsdtAdminController } from './usdt.admin.controller';
import { UsdtAdminService } from './usdt.admin.service';
import { UsdtBlockchainClient } from './usdt-blockchain.client';
import { UsdtBlockchainMonitorService } from './usdt-blockchain-monitor.service';
import { UsdtDepositMatchingService } from './usdt.deposit-matching.service';
import { UsdtProvider } from './usdt.provider';
import { UsdtReconciliationService } from './usdt.reconciliation.service';

@Module({
  imports: [PrismaModule, FinancialOrchestrationModule],
  controllers: [UsdtAdminController],
  providers: [
    UsdtBlockchainClient,
    UsdtDepositMatchingService,
    UsdtProvider,
    UsdtBlockchainMonitorService,
    UsdtAdminService,
    UsdtReconciliationService,
    ProviderEventService,
    SettlementRiskService,
  ],
  exports: [
    UsdtProvider,
    UsdtBlockchainClient,
    UsdtDepositMatchingService,
    UsdtBlockchainMonitorService,
    UsdtAdminService,
    UsdtReconciliationService,
  ],
})
export class UsdtModule {}

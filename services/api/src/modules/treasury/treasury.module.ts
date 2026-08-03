import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AdminModule } from '../admin/admin.module';
import { PaymentOrderModule } from '../payment-order/payment-order.module';
import { AuditModule } from '../audit/audit.module';
import { AutomationModule } from '../automation/automation.module';
import { TreasuryService } from './treasury.service';
import { TreasuryController } from './treasury.controller';
import { PublicTreasuryController } from './public-treasury.controller';
import { TreasuryOperatorService } from './treasury-operator.service';
import { TreasuryOperatorController } from './treasury-operator.controller';
import { OperatorIntelligenceService } from './services/operator-intelligence.service';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    PaymentOrderModule,
    AutomationModule,
    forwardRef(() => AdminModule),
  ],
  controllers: [TreasuryController, PublicTreasuryController, TreasuryOperatorController],
  providers: [TreasuryService, TreasuryOperatorService, OperatorIntelligenceService],
  exports: [TreasuryService, TreasuryOperatorService, OperatorIntelligenceService],
})
export class TreasuryModule {}

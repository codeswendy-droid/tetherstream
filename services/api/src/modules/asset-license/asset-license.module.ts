import { Module } from '@nestjs/common';
import { AssetLicenseController } from './asset-license.controller';
import { AssetLicenseService } from './asset-license.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [AuditModule, NotificationModule],
  controllers: [AssetLicenseController],
  providers: [AssetLicenseService],
  exports: [AssetLicenseService],
})
export class AssetLicenseModule {}

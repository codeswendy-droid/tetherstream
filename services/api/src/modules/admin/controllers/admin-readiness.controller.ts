import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentAdmin, AuthenticatedAdmin } from '../decorators/current-admin.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { RbacGuard } from '../guards/rbac.guard';
import { AdminPermission } from '../interfaces/admin-permissions.enum';
import { ManageDlqDto, ProductionReadinessEngineService } from '../services/production-readiness-engine.service';

@Controller('admin/readiness')
@UseGuards(AdminAuthGuard, RbacGuard)
export class AdminReadinessController {
  constructor(private readonly readinessEngine: ProductionReadinessEngineService) {}

  @Get('overview')
  @Permissions(AdminPermission.READINESS_VIEW)
  async getReadinessOverview() {
    const [reconcile, security, queue, dr] = await Promise.all([
      this.readinessEngine.reconcileLedgerIntegrity(),
      this.readinessEngine.runSecurityRbacAudit(),
      this.readinessEngine.getQueueReliabilityMetrics(),
      this.readinessEngine.getDisasterRecoveryStatus(),
    ]);

    return {
      readinessStatus: reconcile.integrityStatus === 'HEALTHY' && security.securityPass ? 'PRODUCTION_READY' : 'ATTENTION_REQUIRED',
      reconciliation: reconcile,
      securityAudit: security,
      queueReliability: queue,
      disasterRecovery: dr,
    };
  }

  @Post('reconciliation/run')
  @Permissions(AdminPermission.RECONCILIATION_RUN)
  async runReconciliation() {
    return this.readinessEngine.reconcileLedgerIntegrity();
  }

  @Post('security/audit')
  @Permissions(AdminPermission.SECURITY_AUDIT_RUN)
  async runSecurityAudit(@CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.readinessEngine.runSecurityRbacAudit(admin);
  }

  @Get('dlq')
  @Permissions(AdminPermission.READINESS_VIEW)
  async getDlqMetrics() {
    return this.readinessEngine.getQueueReliabilityMetrics();
  }

  @Post('dlq/manage')
  @Permissions(AdminPermission.READINESS_ADMIN)
  async manageDlqItem(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body() dto: ManageDlqDto,
  ) {
    return this.readinessEngine.manageDeadLetterItem(admin, dto);
  }

  @Get('disaster-recovery')
  @Permissions(AdminPermission.DISASTER_RECOVERY_MANAGE)
  async getDisasterRecoveryStatus() {
    return this.readinessEngine.getDisasterRecoveryStatus();
  }

  @Get('runbooks')
  @Permissions(AdminPermission.READINESS_VIEW)
  async getRunbooks() {
    return this.readinessEngine.getOperationalRunbooks();
  }
}

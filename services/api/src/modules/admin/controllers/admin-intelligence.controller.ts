import { Body, Controller, Get, Query, Post, UseGuards } from '@nestjs/common';
import { AuditEventType } from '@prisma/client';
import { CurrentAdmin, AuthenticatedAdmin } from '../decorators/current-admin.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { RbacGuard } from '../guards/rbac.guard';
import { AdminPermission } from '../interfaces/admin-permissions.enum';
import {
  BusinessReportQueryParams,
  ObservabilityIntelligenceEngineService,
} from '../services/observability-intelligence-engine.service';

@Controller('admin/intelligence')
@UseGuards(AdminAuthGuard, RbacGuard)
export class AdminIntelligenceController {
  constructor(private readonly intelligenceEngine: ObservabilityIntelligenceEngineService) {}

  @Get('kpis')
  @Permissions(AdminPermission.OBSERVABILITY_VIEW)
  async getExecutiveKPIs() {
    return this.intelligenceEngine.getExecutiveDashboardKPIs();
  }

  @Get('historical')
  @Permissions(AdminPermission.ANALYTICS_VIEW)
  async getHistoricalAnalytics(
    @Query('period') period?: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    @Query('assetCode') assetCode?: string,
  ) {
    return this.intelligenceEngine.getHistoricalAnalytics({ period, assetCode });
  }

  @Get('machine-asset')
  @Permissions(AdminPermission.ANALYTICS_VIEW)
  async getMachineAssetIntelligence() {
    return this.intelligenceEngine.getMachineAssetIntelligence();
  }

  @Get('forecast')
  @Permissions(AdminPermission.FORECAST_VIEW)
  async getForecastProjections(@Query('days') days?: string) {
    const daysNum = parseInt(days || '30', 10);
    return this.intelligenceEngine.getForecastProjections(daysNum);
  }

  @Get('compliance')
  @Permissions(AdminPermission.COMPLIANCE_VIEW)
  async getComplianceOverview() {
    return this.intelligenceEngine.getComplianceOverview();
  }

  @Get('audit-explorer')
  @Permissions(AdminPermission.AUDIT_VIEW)
  async queryAuditExplorer(
    @Query('adminId') adminId?: string,
    @Query('telegramUserId') telegramUserId?: string,
    @Query('eventType') eventType?: AuditEventType,
    @Query('severity') severity?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('page') page?: string,
  ) {
    return this.intelligenceEngine.queryAuditExplorer({
      adminId,
      telegramUserId,
      eventType,
      severity,
      search,
      startDate,
      endDate,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
    });
  }

  @Post('reports/generate')
  @Permissions(AdminPermission.REPORT_EXPORT)
  async generateBusinessReport(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body() dto: BusinessReportQueryParams,
  ) {
    return this.intelligenceEngine.generateBusinessReport(admin, dto);
  }
}

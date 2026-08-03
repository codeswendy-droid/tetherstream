import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { Permissions } from '../decorators/permissions.decorator';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { RbacGuard } from '../guards/rbac.guard';
import { AdminPermission } from '../interfaces/admin-permissions.enum';
import { AdminDashboardService } from '../services/admin-dashboard.service';
import { LiveEventStreamService } from '../services/live-event-stream.service';
import { UniversalSearchService } from '../services/universal-search.service';
import { FraudCenterService } from '../services/fraud-center.service';
import { FinancialSimulationLabService, SimulationRequestDto } from '../services/financial-simulation-lab.service';

@Controller('admin/dashboard')
@UseGuards(AdminAuthGuard, RbacGuard)
export class AdminDashboardController {
  constructor(
    private readonly dashboardService: AdminDashboardService,
    private readonly liveStreamService: LiveEventStreamService,
    private readonly searchService: UniversalSearchService,
    private readonly fraudService: FraudCenterService,
    private readonly simulationService: FinancialSimulationLabService,
  ) {}

  @Get()
  @Permissions(AdminPermission.SETTLEMENT_VIEW)
  async getDashboard() {
    return this.dashboardService.getDashboardOverview();
  }

  @Get('live-stream')
  @Permissions(AdminPermission.SETTLEMENT_VIEW)
  async getLiveStream(@Query('limit') limit?: string) {
    return this.liveStreamService.getLiveEventStream(limit ? parseInt(limit, 10) : 50);
  }

  @Get('search')
  @Permissions(AdminPermission.SETTLEMENT_VIEW)
  async globalSearch(@Query('q') q: string) {
    return this.searchService.globalSearch(q || '');
  }

  @Get('fraud')
  @Permissions(AdminPermission.RISK_MANAGE)
  async getFraudCenter() {
    return this.fraudService.getFraudRiskOverview();
  }

  @Post('simulation')
  @Permissions(AdminPermission.TREASURY_MANAGE)
  async runSimulation(@Body() dto: SimulationRequestDto) {
    return this.simulationService.runSimulation(dto);
  }
}

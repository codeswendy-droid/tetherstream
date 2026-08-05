import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentAdmin, AuthenticatedAdmin } from '../decorators/current-admin.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { RbacGuard } from '../guards/rbac.guard';
import { AdminPermission } from '../interfaces/admin-permissions.enum';
import {
  GlobalSwitchesDto,
  ManageQueueDto,
  PlatformOperationsEngineService,
  TransitionRiskStateDto,
} from '../services/platform-operations-engine.service';

@Controller('admin/operations-hq')
@UseGuards(AdminAuthGuard, RbacGuard)
export class AdminOperationsHqController {
  constructor(private readonly operationsEngine: PlatformOperationsEngineService) {}

  @Get('health')
  @Permissions(AdminPermission.OPERATIONS_VIEW)
  async getHealthOverview() {
    return this.operationsEngine.getPlatformHealthOverview();
  }

  @Get('switches')
  @Permissions(AdminPermission.OPERATIONS_VIEW)
  async getGlobalSwitches() {
    return this.operationsEngine.getGlobalSwitches();
  }

  @Post('switches')
  @Permissions(AdminPermission.FEATURE_FLAGS_EDIT)
  async updateGlobalSwitches(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body() dto: GlobalSwitchesDto,
  ) {
    return this.operationsEngine.updateGlobalSwitches(admin, dto);
  }

  @Post('risk/transition')
  @Permissions(AdminPermission.RISK_WORKFLOW_MANAGE)
  async transitionRiskState(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body() dto: TransitionRiskStateDto,
  ) {
    return this.operationsEngine.transitionRiskWorkflowState(admin, dto);
  }

  @Get('support/360/:caseId')
  @Permissions(AdminPermission.SUPPORT_360_VIEW)
  async getSupportCase360View(@Param('caseId') caseId: string) {
    return this.operationsEngine.getSupportCase360View(caseId);
  }

  @Get('queues')
  @Permissions(AdminPermission.QUEUE_MANAGE)
  async getQueueItems() {
    return this.operationsEngine.getQueueItems();
  }

  @Post('queues/manage')
  @Permissions(AdminPermission.QUEUE_MANAGE)
  async manageQueueItem(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body() dto: ManageQueueDto,
  ) {
    return this.operationsEngine.manageQueueItem(admin, dto);
  }

  @Get('providers/health')
  @Permissions(AdminPermission.PROVIDER_HEALTH_VIEW)
  async getProviderHealthMetrics() {
    return this.operationsEngine.getProviderHealthMetrics();
  }
}

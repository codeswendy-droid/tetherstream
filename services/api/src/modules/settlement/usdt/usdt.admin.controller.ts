import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/user.interface';
import { UsdtAdminService } from './usdt.admin.service';

@Controller(['admin/settlement/usdt', 'api/v1/admin/settlement/usdt'])
@UseGuards(AuthGuard)
export class UsdtAdminController {
  constructor(private readonly adminService: UsdtAdminService) {}

  @Get('health')
  getHealth() {
    return this.adminService.getConfig();
  }

  @Get('config')
  getConfig() {
    return this.adminService.getConfig();
  }

  @Post('config')
  updateConfig(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: {
      enabled?: boolean;
      network?: string;
      tokenContract?: string;
      receivingAddress?: string;
      requiredConfirmations?: number;
      reason?: string;
    },
  ) {
    return this.adminService.updateConfig(user.id.toString(), dto);
  }

  @Get('transactions')
  listTransactions(
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.adminService.listTransactions({ status, limit: Number(limit) || 50, offset: Number(offset) || 0 });
  }

  @Post('transactions/:id/resolve')
  resolveTransaction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: { targetSettlementSessionId: string; reason: string },
  ) {
    return this.adminService.resolveAmbiguousTransaction(
      user.id.toString(),
      id,
      dto.targetSettlementSessionId,
      dto.reason,
    );
  }
}

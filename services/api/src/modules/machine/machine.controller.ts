import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MachineService } from './machine.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TelegramUserId } from '../../common/decorators/telegram-user-id.decorator';

@ApiTags('Machines')
@Controller('machines')
export class MachineController {
  constructor(private readonly service: MachineService) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Get available Cloud Machine capacity catalog' })
  getCatalog() {
    return this.service.getCatalog();
  }

  @Get('my')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get active user cloud machines and capacity telemetry' })
  async getMyMachines(@TelegramUserId() telegramUserId: bigint) {
    return await this.service.getUserMachines(telegramUserId.toString());
  }

  @Post('purchase')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Purchase and activate a Cloud Machine using wallet balance or initiating deposit' })
  async purchaseMachine(
    @TelegramUserId() telegramUserId: bigint,
    @Body('tierCode') tierCode: string,
    @Body('isSandbox') isSandbox?: boolean,
  ) {
    return this.service.purchaseMachine(telegramUserId, tierCode, isSandbox);
  }

  @Post('repower')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Repower an existing active cloud machine for a 30-day cycle' })
  async repowerMachine(
    @TelegramUserId() telegramUserId: bigint,
    @Body('machineId') machineId: string,
  ) {
    return this.service.repowerMachine(telegramUserId, machineId);
  }

  @Post('upgrade')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Upgrade an existing active machine to a higher tier' })
  async upgradeMachine(
    @TelegramUserId() telegramUserId: bigint,
    @Body('currentMachineId') currentMachineId: string,
    @Body('targetTierCode') targetTierCode: string,
  ) {
    return this.service.upgradeMachineTier(telegramUserId, currentMachineId, targetTierCode);
  }

  @Post(':id/nickname')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Set custom nickname for owned cloud machine' })
  async updateNickname(
    @TelegramUserId() telegramUserId: bigint,
    @Param('id') machineId: string,
    @Body('nickname') nickname: string,
  ) {
    return this.service.updateNickname(telegramUserId.toString(), machineId, nickname);
  }

  @Post(':id/control')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Set machine operational status (start/pause/restart)' })
  async toggleControl(
    @TelegramUserId() telegramUserId: bigint,
    @Param('id') machineId: string,
    @Body('action') action: 'start' | 'pause' | 'restart',
  ) {
    return this.service.toggleControl(telegramUserId.toString(), machineId, action);
  }

  @Get(':id/certificate')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get ownership certificate metadata for specified machine' })
  async getCertificate(
    @TelegramUserId() telegramUserId: bigint,
    @Param('id') machineId: string,
  ) {
    return this.service.getCertificate(telegramUserId.toString(), machineId);
  }
}

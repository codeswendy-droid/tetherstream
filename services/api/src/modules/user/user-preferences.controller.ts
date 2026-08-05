import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserPreferencesService } from './user-preferences.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TelegramUserId } from '../../common/decorators/telegram-user-id.decorator';

@ApiTags('User Preferences')
@Controller('user/preferences')
@UseGuards(AuthGuard)
export class UserPreferencesController {
  constructor(private readonly preferencesService: UserPreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user settings preferences' })
  async getPreferences(@TelegramUserId() telegramUserId: bigint) {
    return this.preferencesService.getPreferences(telegramUserId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update user settings preferences' })
  async updatePreferences(
    @TelegramUserId() telegramUserId: bigint,
    @Body() dto: { settings?: any; notificationChannel?: any },
  ) {
    return this.preferencesService.updatePreferences(telegramUserId, dto);
  }
}

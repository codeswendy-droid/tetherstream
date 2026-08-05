import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentAdmin, AuthenticatedAdmin } from '../decorators/current-admin.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { RbacGuard } from '../guards/rbac.guard';
import { AdminPermission } from '../interfaces/admin-permissions.enum';
import { SearchUsersParams, UserInvestigationService } from '../services/user-investigation.service';

@Controller('admin/users')
@UseGuards(AdminAuthGuard, RbacGuard)
export class AdminUserController {
  constructor(private readonly userService: UserInvestigationService) {}

  @Get()
  @Permissions(AdminPermission.USER_VIEW)
  async listUsers(@Query() query: SearchUsersParams) {
    return this.userService.searchUsers(query);
  }

  @Get(':id')
  @Permissions(AdminPermission.USER_VIEW)
  async getUser(@Param('id') id: string) {
    return this.userService.getUserDetail(id);
  }

  @Post(':id/freeze')
  @Permissions(AdminPermission.USER_FREEZE)
  async freezeUser(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.userService.freezeUser(admin, id, body?.reason);
  }

  @Post(':id/unfreeze')
  @Permissions(AdminPermission.USER_FREEZE)
  async unfreezeUser(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.userService.unfreezeUser(admin, id, body?.reason);
  }

  @Post(':id/ban')
  @Permissions(AdminPermission.USER_BAN)
  async banUser(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.userService.banUser(admin, id, body?.reason);
  }

  @Post(':id/unban')
  @Permissions(AdminPermission.USER_UNBAN)
  async unbanUser(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.userService.unbanUser(admin, id, body?.reason);
  }

  @Get(':id/notes')
  @Permissions(AdminPermission.ADMIN_NOTES_READ)
  async getAdminNotes(@Param('id') id: string) {
    return this.userService.getAdminNotes(id);
  }

  @Post(':id/notes')
  @Permissions(AdminPermission.ADMIN_NOTES_WRITE)
  async addAdminNote(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id') id: string,
    @Body() body: { message: string; visibility?: string },
  ) {
    return this.userService.addAdminNote(admin, id, body);
  }

  @Get(':id/timeline')
  @Permissions(AdminPermission.USER_TIMELINE_VIEW)
  async getUserTimeline(@Param('id') id: string) {
    return this.userService.getUserTimeline(id);
  }
}

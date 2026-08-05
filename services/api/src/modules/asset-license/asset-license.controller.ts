import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Request,
} from '@nestjs/common';
import { AssetLicenseService } from './asset-license.service';
import { 
  CreateAssetLicenseDto, 
  UpdateAssetLicenseDto, 
  GrantLicenseDto 
} from './dto/asset-license.dto';

@Controller('asset-licenses')
export class AssetLicenseController {
  constructor(private readonly assetLicenseService: AssetLicenseService) {}

  @Get('user/:telegramUserId')
  async getUserLicenses(@Param('telegramUserId') telegramUserId: string) {
    return this.assetLicenseService.getUserLicenses(telegramUserId);
  }

  @Get('me')
  async getMyLicenses(@Request() req: any) {
    return this.assetLicenseService.getUserLicenses(req.user.telegramUserId.toString());
  }

  @Get('me/active')
  async getMyActiveLicenses(@Request() req: any) {
    return this.assetLicenseService.getActiveLicenses(req.user.telegramUserId.toString());
  }

  @Get('me/:asset')
  async getMyLicense(@Request() req: any, @Param('asset') asset: string) {
    return this.assetLicenseService.getUserLicense(req.user.telegramUserId.toString(), asset);
  }

  @Get('check/:asset')
  async checkLicense(@Request() req: any, @Param('asset') asset: string) {
    const hasLicense = await this.assetLicenseService.checkLicense(
      req.user.telegramUserId.toString(), 
      asset
    );
    return { hasLicense, asset };
  }

  @Post('grant')
  async grantLicense(@Body() dto: GrantLicenseDto, @Request() req: any) {
    return this.assetLicenseService.grantLicense(dto, req.user.id);
  }

  @Patch(':licenseId')
  async updateLicense(
    @Param('licenseId') licenseId: string,
    @Body() dto: UpdateAssetLicenseDto,
    @Request() req: any
  ) {
    return this.assetLicenseService.updateLicense(licenseId, dto, req.user.id);
  }

  @Delete(':licenseId')
  async deleteLicense(@Param('licenseId') licenseId: string, @Request() req: any) {
    return this.assetLicenseService.deleteLicense(licenseId, req.user.id);
  }
}

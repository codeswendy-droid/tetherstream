import { IsEnum, IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

export enum AssetLicenseStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  REVOKED = 'REVOKED',
}

export enum AssetLicenseType {
  PURCHASED = 'PURCHASED',
  PROMOTIONAL = 'PROMOTIONAL',
  ADMIN_GRANTED = 'ADMIN_GRANTED',
  LIFETIME = 'LIFETIME',
}

export class CreateAssetLicenseDto {
  @IsString()
  asset: string;

  @IsEnum(AssetLicenseType)
  licenseType: AssetLicenseType;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  grantedBy?: string;

  @IsOptional()
  @IsUUID()
  purchaseTransactionId?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateAssetLicenseDto {
  @IsEnum(AssetLicenseStatus)
  status: AssetLicenseStatus;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class GrantLicenseDto {
  @IsString()
  telegramUserId: string;

  @IsString()
  asset: string;

  @IsEnum(AssetLicenseType)
  licenseType: AssetLicenseType;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

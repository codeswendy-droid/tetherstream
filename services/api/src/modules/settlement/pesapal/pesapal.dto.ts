import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PesapalIpnDto {
  @IsString()
  @IsNotEmpty()
  OrderTrackingId!: string;

  @IsString()
  @IsNotEmpty()
  OrderNotificationType!: string;

  @IsString()
  @IsNotEmpty()
  OrderMerchantReference!: string;
}

export class PesapalCallbackQueryDto {
  @IsString()
  @IsOptional()
  OrderTrackingId?: string;

  @IsString()
  @IsOptional()
  OrderMerchantReference?: string;

  @IsString()
  @IsOptional()
  OrderNotificationType?: string;
}

export class PesapalApproveAdminDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

export class PesapalRejectAdminDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

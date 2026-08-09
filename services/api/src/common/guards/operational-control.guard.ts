import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PlatformOperationsEngineService } from '../../modules/admin/services/platform-operations-engine.service';

@Injectable()
export class OperationalControlGuard implements CanActivate {
  private readonly logger = new Logger(OperationalControlGuard.name);

  constructor(
    @Inject(forwardRef(() => PlatformOperationsEngineService))
    private readonly opsEngine: PlatformOperationsEngineService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const url = request.url || '';
    const method = request.method || 'GET';

    // Allow admin control plane routes unconditionally so admins can manage emergency switches during incidents
    if (url.startsWith('/admin') || url.startsWith('/api/admin')) {
      return true;
    }

    const switches = await this.opsEngine.getGlobalSwitches();

    // 1. Maintenance mode blocks all user-facing endpoints
    if (switches.maintenanceMode) {
      throw new ForbiddenException('PLATFORM_MAINTENANCE_ACTIVE: System is currently under maintenance.');
    }

    // 2. Read-only mode blocks non-admin mutation methods (POST, PUT, PATCH, DELETE)
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
    if (switches.readOnlyMode && isMutation && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      throw new ForbiddenException('PLATFORM_READ_ONLY_ACTIVE: System is currently in read-only mode.');
    }

    return true;
  }
}

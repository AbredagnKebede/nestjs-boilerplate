import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { MfaService } from '../services/mfa.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

@Injectable()
export class MfaGuard implements CanActivate {
  constructor(
    private readonly mfaService: MfaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check if MFA is enabled for user
    const isMfaEnabled = await this.mfaService.isMfaEnabled(user.id);
    
    if (!isMfaEnabled) {
      // MFA not enabled, allow access
      return true;
    }

    // Check if MFA was already verified in this session
    const mfaVerified = request.session?.mfaVerified;
    if (mfaVerified && request.session.userId === user.id) {
      return true;
    }

    throw new UnauthorizedException('MFA verification required');
  }
}
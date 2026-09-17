import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest();

    const authHeader =
      request.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ')
    ) {
      throw new UnauthorizedException(
        'No Bearer token provided',
      );
    }

    const token =
      authHeader.substring(7).trim();

    if (!token) {
      throw new UnauthorizedException(
        'No token provided',
      );
    }

    // Check whether the token was logged out/revoked
    if (this.authService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException(
        'Token has been revoked',
      );
    }

    try {
      const payload =
        await this.jwtService.verifyAsync(token);

      request.user = {
        id: payload.sub,
        playerId: payload.playerId,
        email: payload.email,
        userType: payload.userType,
        isAdmin:
          payload.isAdmin ?? false,
      };

      return true;
    } catch (error) {
      console.error(
        'JWT AUTH ERROR:',
        error,
      );

      throw new UnauthorizedException(
        'Invalid or expired token',
      );
    }
  }
}
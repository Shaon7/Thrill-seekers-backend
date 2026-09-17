import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class PlayerOwnershipGuard
  implements CanActivate
{
  canActivate(
    context: ExecutionContext,
  ): boolean {
    const request =
      context.switchToHttp().getRequest();

    const user = request.user;
    const playerId = request.params.playerId;

    if (!user) {
      throw new ForbiddenException(
        'Authentication required',
      );
    }

    // Super Admin can access any player
    if (user.userType === 'superadmin') {
      return true;
    }

    // Player can only access their own account
    if (
      user.userType === 'player' &&
      user.playerId === playerId
    ) {
      return true;
    }

    throw new ForbiddenException(
      'You can only access your own player account',
    );
  }
}
import { Injectable } from '@nestjs/common';

import {
  PassportStrategy,
} from '@nestjs/passport';

import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
) {
  constructor() {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey:
        process.env.JWT_SECRET ||
        'your-secret-key',
    });
  }

  async validate(payload: any) {
    console.log('JWT PAYLOAD:', payload);

    return {
      id: payload.sub,
      playerId: payload.playerId,
      email: payload.email,

      // Support both userType and role
      userType: payload.userType ?? payload.role,

      isAdmin: payload.isAdmin ?? false,
    };
  }
}
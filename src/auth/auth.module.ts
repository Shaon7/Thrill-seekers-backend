import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { Player } from '../player/player.entity.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { AdminGuard } from './admin.guard.js';
import { SuperAdminGuard } from './super-admin.guard.js';
import { PlayerOwnershipGuard } from './player-ownership.guard.js';
import { SuperAdmin } from '../super-admin/super-admin.entity.js';
import { MailModule } from '../mail/mail.module.js';

@Module({
  imports: [
    MailModule,
    TypeOrmModule.forFeature([Player, SuperAdmin]),
    PassportModule,

    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: {
        expiresIn: '1d',
      },
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    AdminGuard,
    SuperAdminGuard,
    PlayerOwnershipGuard,
  ],

  exports: [
    AuthService,
    JwtModule,
    JwtAuthGuard,
    AdminGuard,
    SuperAdminGuard,
    PlayerOwnershipGuard,
  ],
})
export class AuthModule {}
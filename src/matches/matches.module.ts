import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MatchController } from './matches.controller.js';
import { MatchService } from './matches.service.js';
import { Match } from './matches.entity.js';
import { Division } from '../division/division.entity.js';
import { PointTable } from '../point-table/point-table.entity.js';
import { Player } from '../player/player.entity.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AuthModule } from '../auth/auth.module.js';
import { PaymentModule } from '../payment/payment.module.js';
import { NotificationModule } from '../notification/notification.module.js';

@Module({
  imports: [
    AuthModule,
    PaymentModule,
    TypeOrmModule.forFeature([
      Match,
      Division,
      PointTable,
      Player,
    ]),
    NotificationModule,
  ],
  controllers: [
    MatchController,
  ],
  providers: [
    MatchService,
  ],
})
export class MatchesModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Notification } from './notification.entity.js';
import { NotificationController } from './notification.controller.js';
import { NotificationService } from './notification.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
    ]),
    AuthModule,
  ],
  controllers: [
    NotificationController,
  ],
  providers: [
    NotificationService,
  ],
  exports: [
    NotificationService,
  ],
})
export class NotificationModule {}
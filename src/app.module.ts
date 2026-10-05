import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PlayerModule } from './player/player.module.js';
import { MatchesModule } from './matches/matches.module.js';
import { DivisionModule } from './division/division.module.js';
import { PointTableModule } from './point-table/point-table.module.js';
import { AuthModule } from './auth/auth.module.js';
import { SuperAdminModule } from './super-admin/super-admin.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from './mail/mail.module.js';
import { PaymentModule } from './payment/payment.module.js';
import { NotificationModule } from './notification/notification.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        type: 'postgres',

        url: configService.get<string>(
          'DATABASE_URL',
        ),

        ssl: true,

        autoLoadEntities: true,

        synchronize: false,
      }),
    }),

    PlayerModule,
    MatchesModule,
    DivisionModule,
    PointTableModule,
    AuthModule,
    SuperAdminModule,
    MailModule,
    PaymentModule,
    NotificationModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}
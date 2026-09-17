import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DivisionController } from './division.controller.js';
import { DivisionService } from './division.service.js';
import { Division } from './division.entity.js';
import { Player } from '../player/player.entity.js';
import { PointTable } from '../point-table/point-table.entity.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Division,
      Player,
      PointTable,
    ]),
  ],
  controllers: [DivisionController],
  providers: [DivisionService],
})
export class DivisionModule {}
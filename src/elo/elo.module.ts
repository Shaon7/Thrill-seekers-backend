import {
  Module,
} from '@nestjs/common';

import {
  TypeOrmModule,
} from '@nestjs/typeorm';

import {
  EloRatingHistory,
} from './elo-rating-history.entity.js';

import {
  EloService,
} from './elo.service.js';

import {
  EloController,
} from './elo.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EloRatingHistory,
    ]),
  ],

  controllers: [
    EloController,
  ],

  providers: [
    EloService,
  ],

  exports: [
    EloService,
  ],
})
export class EloModule {}
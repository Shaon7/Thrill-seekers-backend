import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { PointTableService } from './point-table.service.js';
import { CreatePointTableDto } from './dto/create-point-table.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('point-tables')
export class PointTableController {
  constructor(
    private readonly pointTableService: PointTableService,
  ) {}

  // Create the initial rows for a competition.
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePointTableDto) {
    return this.pointTableService.createForCompetition(
      dto.competitionId,
      dto.playerIds,
    );
  }

  // Get the ranked point table.
  @Get('competition/:competitionId')
  findByCompetition(
    @Param('competitionId') competitionId: string,
  ) {
    return this.pointTableService.findByCompetition(competitionId);
  }

  // Get one player's standing.
  @Get('competition/:competitionId/player/:playerId')
  findOne(
    @Param('competitionId') competitionId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.pointTableService.findOne(
      competitionId,
      playerId,
    );
  }
}
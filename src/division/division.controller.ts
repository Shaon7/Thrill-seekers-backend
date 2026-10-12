import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { DivisionService } from './division.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { SuperAdminGuard } from '../auth/super-admin.guard.js';

@Controller('divisions')
export class DivisionController {
  constructor(
    private readonly divisionService: DivisionService,
  ) {}

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post()
  create(@Body() divisionData: any) {
    return this.divisionService.create({
      ...divisionData,
      Status: 'IN_PROGRESS',
    });
  }

  @Get()
  findAll() {
    return this.divisionService.findAll();
  }

  @Get('sendleaguemail')
  sendleaguemail() {
    return this.divisionService.sendRunningLeagueEmails();
  }

  @Get(':divisionId')
  findOne(
    @Param('divisionId') divisionId: string,
  ) {
    return this.divisionService.findOne(divisionId);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Patch(':divisionId')
  update(
    @Param('divisionId') divisionId: string,
    @Body() divisionData: any,
  ) {
    return this.divisionService.update(
      divisionId,
      divisionData,
    );
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Delete(':divisionId')
  remove(
    @Param('divisionId') divisionId: string,
  ) {
    return this.divisionService.remove(divisionId);
  }

  // Add player while the division is still in setup mode.
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post(':divisionId/players/:playerId')
  addPlayer(
    @Param('divisionId') divisionId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.divisionService.addPlayer(
      divisionId,
      playerId,
    );
  }

  // Remove player while the division is still in setup mode.
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Delete(':divisionId/players/:playerId')
  removePlayer(
    @Param('divisionId') divisionId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.divisionService.removePlayer(
      divisionId,
      playerId,
    );
  }

  // Replace one roster member with another before the league starts.
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Patch(':divisionId/players/:oldPlayerId/replace/:newPlayerId')
  replacePlayer(
    @Param('divisionId') divisionId: string,
    @Param('oldPlayerId') oldPlayerId: string,
    @Param('newPlayerId') newPlayerId: string,
  ) {
    return this.divisionService.replacePlayer(
      divisionId,
      oldPlayerId,
      newPlayerId,
    );
  }
}

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
    return this.divisionService.create(divisionData);
  }

  @Get()
  findAll() {
    return this.divisionService.findAll();
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
}
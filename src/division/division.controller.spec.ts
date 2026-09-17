import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { DivisionService } from './division.service.js';

@Controller('divisions')
export class DivisionController {
  constructor(
    private readonly divisionService: DivisionService,
  ) {}

  @Post('create')
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

  @Post(':divisionId/add-player/:playerId')
  addPlayer(
    @Param('divisionId') divisionId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.divisionService.addPlayer(
      divisionId,
      playerId,
    );
  }

  @Delete(':divisionId/remove-player/:playerId')
  removePlayer(
    @Param('divisionId') divisionId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.divisionService.removePlayer(
      divisionId,
      playerId,
    );
  }

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

  @Delete(':divisionId')
  remove(
    @Param('divisionId') divisionId: string,
  ) {
    return this.divisionService.remove(divisionId);
  }
}
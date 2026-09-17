import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { SuperAdminGuard } from '../auth/super-admin.guard.js';
import { PlayerOwnershipGuard } from '../auth/player-ownership.guard.js';
import { PlayerService } from './player.service.js';
import { Player } from './player.entity.js';

@Controller('player')
export class PlayerController {
  constructor(
    private readonly playerService: PlayerService,
  ) {}

  @Post()
  async create(
    @Body() playerData: Partial<Player>,
  ) {
    return this.playerService.create(playerData);
  }

  @Get()
  findAll() {
    return this.playerService.findAll();
  }

  @Get(':playerId')
  findOne(
    @Param('playerId') playerId: string,
  ) {
    return this.playerService.findOne(playerId);
  }

  @Patch(':playerId')
  @UseGuards(JwtAuthGuard, PlayerOwnershipGuard)
  update(
    @Param('playerId') playerId: string,
    @Body() playerData: any,
  ) {
    return this.playerService.update(
      playerId,
      playerData,
    );
  }

  @Delete(':playerId')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  remove(
    @Param('playerId') playerId: string,
  ) {
    return this.playerService.remove(playerId);
  }

  // =====================================================
  // ADD ADMIN
  // SUPERADMIN ONLY
  // =====================================================

  @Patch(':playerId/admin')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async addAdmin(
    @Param('playerId') playerId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.playerService.addAdmin(
      playerId,
    );
  }

  // =====================================================
  // REMOVE ADMIN
  // SUPERADMIN ONLY
  // =====================================================

  @Delete(':playerId/admin')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async removeAdmin(
    @Param('playerId') playerId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.playerService.removeAdmin(
      playerId,
    );
  }
}
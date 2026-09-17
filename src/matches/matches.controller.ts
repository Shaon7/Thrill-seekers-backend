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
import { AdminGuard } from '../auth/admin.guard.js';
import { SuperAdminGuard } from '../auth/super-admin.guard.js';
import { MatchService } from './matches.service.js';

@Controller('matches')
export class MatchController {
  constructor(
    private readonly matchService: MatchService,
  ) {}

  // =====================================================
  // CREATE MATCH
  // SUPERADMIN ONLY
  // =====================================================

  @Post()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  create(@Body() matchData: any) {
    return this.matchService.create(
      matchData,
    );
  }

  // =====================================================
  // ALL MATCHES
  // =====================================================

  @Get()
  findAll() {
    return this.matchService.findAll();
  }

  // =====================================================
  // ALL ADMINS
  // =====================================================

  @Get('admins')
  findAdmins() {
    return this.matchService.findAdmins();
  }

  // =====================================================
  // MATCHES BY COMPETITION
  // =====================================================

  @Get('competition/:competitionId')
  findByCompetition(
    @Param('competitionId')
    competitionId: string,
  ) {
    return this.matchService.findByCompetition(
      competitionId,
    );
  }

  // =====================================================
  // GENERATE DIVISION MATCHES
  // SUPERADMIN ONLY
  // =====================================================

  @Post('division/:divisionId/generate')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  generateDivisionMatches(
    @Param('divisionId')
    divisionId: string,
  ) {
    return this.matchService.generateDivisionMatches(
      divisionId,
    );
  }

  // =====================================================
  // FIND ONE MATCH
  // =====================================================

  @Get(':matchId')
  findOne(
    @Param('matchId')
    matchId: string,
  ) {
    return this.matchService.findOne(
      matchId,
    );
  }

  // =====================================================
  // ASSIGN ADMIN
  // SUPERADMIN ONLY
  // =====================================================

  @Patch(':matchId/admin')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async assignAdmin(
    @Param('matchId')
    matchId: string,

    @Body()
    body: {
      adminPlayerId: string;
    },
  ) {
    return this.matchService.assignAdmin(
      matchId,
      body.adminPlayerId,
    );
  }

  // =====================================================
  // SUBMIT RESULT
  // ADMIN ONLY
  // =====================================================

  @Post(':matchId/result')
  @UseGuards(JwtAuthGuard)
  submitResult(
    @Param('matchId')
    matchId: string,

    @Body()
    resultData: {
      homeScore: number;
      awayScore: number;
    },

    @Req() req: Request,
  ) {
    return this.matchService.submitResult(
      matchId,
      resultData.homeScore,
      resultData.awayScore,
      req.user as any,
    );
  }

  // =====================================================
  // UPDATE MATCH
  // SUPERADMIN ONLY
  // =====================================================

  @Patch(':matchId')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async update(
    @Param('matchId')
    matchId: string,

    @Body()
    matchData: any,
  ) {
    return this.matchService.update(
      matchId,
      matchData,
    );
  }

  // =====================================================
  // DELETE MATCH
  // SUPERADMIN ONLY
  // =====================================================

  @Delete(':matchId')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async remove(
    @Param('matchId')
    matchId: string,
  ) {
    return this.matchService.remove(
      matchId,
    );
  }

  // =====================================================
  // CHANGE MATCH TIME
  // SUPERADMIN ONLY
  // =====================================================

  @Patch(':matchId/change-time')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async changeMatchTime(
    @Param('matchId')
    matchId: string,

    @Body()
    body: {
      newDate: string;
    },
  ) {
    return this.matchService.changeMatchTime(
      matchId,
      body.newDate,
    );
  }
}
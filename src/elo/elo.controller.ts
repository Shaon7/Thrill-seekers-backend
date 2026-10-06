import {
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { SuperAdminGuard } from '../auth/super-admin.guard.js';

import { EloService } from './elo.service.js';

@Controller('elo')
export class EloController {
  constructor(
    private readonly eloService: EloService,
  ) {}

  // =====================================================
  // REBUILD GLOBAL ELO RATINGS
  // SUPERADMIN ONLY
  // =====================================================

  @Post('rebuild')
  async rebuildGlobalRatings() {
    await this.eloService.rebuildGlobalRatings();

    return {
      success: true,
      message:
        'Global Elo ratings rebuilt successfully.',
    };
  }
}
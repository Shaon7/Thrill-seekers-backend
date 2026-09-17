import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';

import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  // =====================================================
  // LOGIN
  // =====================================================

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  @Post('logout')
  async logout(@Req() req: Request) {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ')
    ) {
      throw new UnauthorizedException(
        'No token provided',
      );
    }

    const token =
      authHeader.split(' ')[1];

    await this.authService.logout(token);

    return {
      message: 'Logout successful',
    };
  }

  
 
  @Post('forgot-password')
  async forgotPassword(
    @Body()
    body: {
      email: string;
    },
  ) {
    return this.authService.forgotPassword(
      body.email,
    );
  }

  // =====================================================
  // VERIFY RESET CODE
  // =====================================================

  @Post('verify-reset-code')
  async verifyResetCode(
    @Body()
    body: {
      email: string;
      code: string;
    },
  ) {
    return this.authService.verifyResetCode(
      body.email,
      body.code,
    );
  }

  // =====================================================
  // RESET PASSWORD
  // =====================================================

  @Post('reset-password')
  async resetPassword(
    @Body()
    body: {
      email: string;
      code: string;
      newPassword: string;
    },
  ) {
    return this.authService.resetPassword(
      body.email,
      body.code,
      body.newPassword,
    );
  }

 
}
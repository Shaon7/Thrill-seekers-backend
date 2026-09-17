import {
  Injectable,
  UnauthorizedException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { Player } from '../player/player.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { SuperAdmin } from '../super-admin/super-admin.entity.js';
import { MailService } from '../mail/mail.service.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(SuperAdmin)
    private readonly superAdminRepository:Repository<SuperAdmin>,
    private readonly mailService:MailService,
    private readonly jwtService: JwtService,
  ) {}

  private blacklistedTokens = new Set<string>();

  async login(dto: LoginDto) {
  // 1. Check Player
  const player = await this.playerRepository.findOne({
    where: [
      { playerId: dto.login },
      { email: dto.login },
    ],
  });

  if (player) {
    const passwordMatched = await bcrypt.compare(
      dto.password,
      player.password,
    );

    if (!passwordMatched) {
      throw new UnauthorizedException(
        'Invalid player ID/email or password',
      );
    }

    const payload = {
      sub: player.id,
      userType: 'player',
      playerId: player.playerId,
      email: player.email,
      isAdmin: player.isAdmin,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      access_token: accessToken,
      token_type: 'Bearer',
      userType: 'player',
      player: {
        id: player.id,
        playerId: player.playerId,
        name: player.name,
        email: player.email,
        konamiId: player.konamiId,
        deviceName: player.deviceName,
        isAdmin: player.isAdmin,
      },
    };
  }

  // 2. Check SuperAdmin
  const superAdmin = await this.superAdminRepository.findOne({
    where: {
      email: dto.login,
    },
  });

  if (superAdmin) {
    const passwordMatched = await bcrypt.compare(
      dto.password,
      superAdmin.password,
    );

    if (!passwordMatched) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const payload = {
      sub: superAdmin.id,
      userType: 'superadmin',
      email: superAdmin.email,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'SuperAdmin login successful',
      access_token: accessToken,
      token_type: 'Bearer',
      userType: 'superadmin',
      superAdmin: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
      },
    };
  }

  // 3. Neither Player nor SuperAdmin found
  throw new UnauthorizedException(
    'Invalid player ID/email or password',
  );
}



  async logout(token: string) {
    this.blacklistedTokens.add(token);

    return {
      message: 'Token blacklisted successfully',
    };
  }

  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

      async forgotPassword(
    email: string,
  ) {
    const player =
      await this.playerRepository.findOne({
        where: {
          email,
        },
      });

    /*
     * Do not reveal whether the email
     * exists or not.
     */
    if (!player) {
      return {
        success: true,
        message:
          'If this email is registered, a verification code has been sent.',
      };
    }

    /*
     * Generate 6-digit code.
     */
    const code =
      Math.floor(
        100000 +
          Math.random() *
            900000,
      ).toString();

    /*
     * Store code.
     */
    player.passwordResetCode =
      await bcrypt.hash(
        code,
        10,
      );

    /*
     * Code expires in 10 minutes.
     */
    player.passwordResetCodeExpiresAt =
      new Date(
        Date.now() +
          10 * 60 * 1000,
      );

    await this.playerRepository.save(
      player,
    );

    try {
      await this.mailService.sendPasswordResetCode(
        player.email,
        player.name,
        code,
      );
    } catch (error) {
      console.error(
        'Password reset email failed:',
        error,
      );

      /*
       * Remove reset code if email
       * could not be sent.
       */
      player.passwordResetCode =
        null;

      player.passwordResetCodeExpiresAt =
        null;

      await this.playerRepository.save(
        player,
      );

      throw new BadRequestException(
        'Unable to send password reset email. Please try again later.',
      );
    }

    return {
      success: true,
      message:
        'If this email is registered, a verification code has been sent.',
    };
  }

   async verifyResetCode(
    email: string,
    code: string,
  ) {
    const player =
      await this.playerRepository.findOne({
        where: {
          email,
        },
      });

    if (!player) {
      throw new BadRequestException(
        'Invalid verification code.',
      );
    }

    if (
      !player.passwordResetCode ||
      !player.passwordResetCodeExpiresAt
    ) {
      throw new BadRequestException(
        'No password reset request found.',
      );
    }

    if (
      new Date() >
      player.passwordResetCodeExpiresAt
    ) {
      player.passwordResetCode =
        null;

      player.passwordResetCodeExpiresAt =
        null;

      await this.playerRepository.save(
        player,
      );

      throw new BadRequestException(
        'Verification code has expired.',
      );
    }

    const codeMatched =
      await bcrypt.compare(
        code,
        player.passwordResetCode,
      );

    if (!codeMatched) {
      throw new BadRequestException(
        'Invalid verification code.',
      );
    }

    return {
      success: true,
      message:
        'Verification code is valid.',
    };
  }
  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ) {
    const player =
      await this.playerRepository.findOne({
        where: {
          email,
        },
      });

    if (!player) {
      throw new BadRequestException(
        'Invalid password reset request.',
      );
    }

    if (
      !player.passwordResetCode ||
      !player.passwordResetCodeExpiresAt
    ) {
      throw new BadRequestException(
        'No password reset request found.',
      );
    }

    if (
      new Date() >
      player.passwordResetCodeExpiresAt
    ) {
      player.passwordResetCode =
        null;

      player.passwordResetCodeExpiresAt =
        null;

      await this.playerRepository.save(
        player,
      );

      throw new BadRequestException(
        'Verification code has expired.',
      );
    }

    const codeMatched =
      await bcrypt.compare(
        code,
        player.passwordResetCode,
      );

    if (!codeMatched) {
      throw new BadRequestException(
        'Invalid verification code.',
      );
    }

    /*
     * Hash new password.
     */
    player.password =
      await bcrypt.hash(
        newPassword,
        10,
      );

    /*
     * Invalidate the code.
     */
    player.passwordResetCode =
      null;

    player.passwordResetCodeExpiresAt =
      null;

    await this.playerRepository.save(
      player,
    );

    return {
      success: true,
      message:
        'Password reset successfully.',
    };
  }
  
}


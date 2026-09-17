import {
  Injectable,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Player } from './player.entity.js';
import { MailService } from '../mail/mail.service.js';


import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,

    private readonly mailService:
    MailService,
  ) {}

  async create(playerData: Partial<Player>) {
  try {
    // Check if email already exists
    if (playerData.email) {
      const existingEmail = await this.playerRepository.findOne({
        where: {
          email: playerData.email,
        },
      });

      if (existingEmail) {
        throw new ConflictException(
          'This email is already registered.',
        );
      }
    }

    // Check if KONAMI ID already exists
    if (playerData.konamiId) {
      const existingKonamiId =
        await this.playerRepository.findOne({
          where: {
            konamiId: playerData.konamiId,
          },
        });

      if (existingKonamiId) {
        throw new ConflictException(
          'This KONAMI User ID is already registered.',
        );
      }
    }

    // Find the latest player
    const players = await this.playerRepository.find({
      order: {
        id: 'DESC',
      },
      take: 1,
    });

    let nextNumber = 1;

    if (players.length > 0) {
      nextNumber = players[0].id + 1;
    }

    const playerId = `THS-${String(nextNumber).padStart(4, '0')}`;

    // Hash password before saving
    if (playerData.password) {
      playerData.password = await bcrypt.hash(
        playerData.password,
        10,
      );
    }

    const player = this.playerRepository.create({
      ...playerData,
      playerId,
      isAdmin: false,
    });

    const savedPlayer =
      await this.playerRepository.save(player);


       try {
      await this.mailService.sendWelcomeEmail(
        savedPlayer.email,
        savedPlayer.name,
        savedPlayer.playerId,
      );
    } catch (mailError) {
      /*
       * Registration should still remain successful
       * if the email service temporarily fails.
       */
      console.error(
        'Welcome email sending failed:',
        mailError,
      );
    }
    // Never send password back to frontend
    const { password, ...safePlayer } = savedPlayer;

    return {
      success: true,
      message: 'Registration successful.',
      playerId: safePlayer.playerId,
      player: safePlayer,
    };
  } catch (error) {
    // Keep our own meaningful errors
    if (error instanceof ConflictException) {
      throw error;
    }

    console.error('Player registration error:', error);

    throw new InternalServerErrorException(
      'Registration failed. Please try again later.',
    );
  }
}

  async findAll() {
    return this.playerRepository.find({
      order: {
        id: 'ASC',
      },
    });
  }

  async findOne(playerId: string) {
    const player = await this.playerRepository.findOne({
      where: { playerId },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    return player;
  }

  async update(
  playerId: string,
  playerData: Partial<Player>,
) {
  const player = await this.findOne(playerId);

  if (playerData.name !== undefined) {
    player.name = playerData.name;
  }

  if (playerData.konamiId !== undefined) {
    player.konamiId = playerData.konamiId;
  }

  if (playerData.deviceName !== undefined) {
    player.deviceName = playerData.deviceName;
  }

  if (playerData.password !== undefined) {
    player.password = await bcrypt.hash(
      playerData.password,
      10,
    );
  }

  return this.playerRepository.save(player);
}

  async remove(playerId: string) {
    const player = await this.findOne(playerId);

    await this.playerRepository.remove(player);

    return {
      message: 'Player deleted successfully',
    };
  }

  async addAdmin(playerId: string) {
  const player = await this.playerRepository.findOne({
    where: {
      playerId,
    },
  });

  if (!player) {
    throw new NotFoundException(
      'Player not found.',
    );
  }

  if (player.isAdmin) {
    return {
      success: true,
      message: 'Player is already an admin.',
      player,
    };
  }

  player.isAdmin = true;

  const updatedPlayer =
    await this.playerRepository.save(player);

  return {
    success: true,
    message: 'Player added as admin successfully.',
    player: updatedPlayer,
  };
}

async removeAdmin(playerId: string) {
  const player = await this.playerRepository.findOne({
    where: {
      playerId,
    },
  });

  if (!player) {
    throw new NotFoundException(
      'Player not found.',
    );
  }

  if (!player.isAdmin) {
    throw new BadRequestException(
      'This player is not an admin.',
    );
  }

  player.isAdmin = false;

  const updatedPlayer =
    await this.playerRepository.save(player);

  return {
    success: true,
    message: 'Admin access removed successfully.',
    player: updatedPlayer,
  };
}
}
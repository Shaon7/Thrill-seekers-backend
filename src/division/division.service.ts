import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Division } from './division.entity.js';
import { Player } from '../player/player.entity.js';
import { PointTable } from '../point-table/point-table.entity.js';
import { MailService } from '../mail/mail.service.js';

@Injectable()
export class DivisionService {
  constructor(
    @InjectRepository(Division)
    private readonly divisionRepository: Repository<Division>,

    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,

    @InjectRepository(PointTable)
    private readonly pointTableRepository: Repository<PointTable>,

    private readonly mailService: MailService,
  ) {}

  // =====================================================
  // CREATE DIVISION
  // =====================================================

  async create(divisionData: Partial<Division>) {
    const divisions = await this.divisionRepository.find({
      order: {
        id: 'DESC',
      },
      take: 1,
    });

    let nextNumber = 1;

    if (divisions.length > 0) {
      nextNumber = divisions[0].id + 1;
    }

    const divisionId = `DIV-${String(nextNumber).padStart(4, '0')}`;

    let name = '';

    if (divisionData.divisionNumber === 1) {
      name = 'Thrill Seekers Premier League';
    } else if (divisionData.divisionNumber === 2) {
      name = 'Thrill Seekers Championship';
    } else if (divisionData.divisionNumber === 3) {
      name = 'Thrill Seekers League One';
    } else {
      name = `Thrill Seekers Division ${divisionData.divisionNumber}`;
    }

    // Do not allow the request body to set the division ID,
    // competition ID, status, or initial player roster.
    const dataToSave: Partial<Division> = {
      ...divisionData,
    };

    delete dataToSave.id;
    delete dataToSave.divisionId;
    delete dataToSave.competitionId;
    delete dataToSave.Status;
    delete dataToSave.players;
    delete dataToSave.createdAt;
    delete dataToSave.updatedAt;

    const division = this.divisionRepository.create({
      ...dataToSave,
      divisionId,
      competitionId: divisionId,
      name,
      Status: 'IN_PROGRESS',
      players: [],
    });

    return this.divisionRepository.save(division);
  }

  // =====================================================
  // GET ALL DIVISIONS
  // =====================================================

  async findAll() {
    return this.divisionRepository.find({
      order: {
        season: 'DESC',
        phase: 'ASC',
        divisionNumber: 'ASC',
      },
      relations: {
        players: true,
      },
    });
  }

  // =====================================================
  // GET ONE DIVISION
  // =====================================================

  async findOne(divisionId: string) {
    const division = await this.divisionRepository.findOne({
      where: {
        divisionId,
      },
      relations: {
        players: true,
      },
    });

    if (!division) {
      throw new NotFoundException('Division not found');
    }

    return division;
  }

  // =====================================================
  // ADD PLAYER
  // Only allowed before the league starts.
  // This operation changes the roster only.
  // =====================================================

  async addPlayer(
    divisionId: string,
    playerId: string,
  ) {
    const division = await this.findOne(divisionId);

    this.ensureDivisionIsInProgress(division);

    const player = await this.playerRepository.findOne({
      where: {
        playerId,
      },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    const alreadyAdded = division.players.some(
      (divisionPlayer) =>
        divisionPlayer.playerId === playerId,
    );

    if (alreadyAdded) {
      throw new ConflictException(
        'Player is already in this division',
      );
    }

    division.players.push(player);

    await this.divisionRepository.save(division);

    return {
      success: true,
      message: 'Player added to division successfully',
      divisionId: division.divisionId,
      playerId: player.playerId,
      playerCount: division.players.length,
      status: division.Status,
    };
  }

  // =====================================================
  // REMOVE PLAYER
  // Only allowed before the league starts.
  // This operation changes the roster only.
  // =====================================================

  async removePlayer(
    divisionId: string,
    playerId: string,
  ) {
    const division = await this.findOne(divisionId);

    this.ensureDivisionIsInProgress(division);

    const playerIndex = division.players.findIndex(
      (player) => player.playerId === playerId,
    );

    if (playerIndex === -1) {
      throw new NotFoundException(
        'Player is not in this division',
      );
    }

    division.players.splice(playerIndex, 1);

    await this.divisionRepository.save(division);

    return {
      success: true,
      message: 'Player removed from division successfully',
      divisionId: division.divisionId,
      playerId,
      playerCount: division.players.length,
      status: division.Status,
    };
  }

  // =====================================================
  // REPLACE PLAYER
  // Only allowed before the league starts.
  // This operation changes the roster only.
  // =====================================================

  async replacePlayer(
    divisionId: string,
    oldPlayerId: string,
    newPlayerId: string,
  ) {
    const division = await this.findOne(divisionId);

    this.ensureDivisionIsInProgress(division);

    if (oldPlayerId === newPlayerId) {
      throw new ConflictException(
        'The new player must be different from the current player',
      );
    }

    const oldPlayerIndex = division.players.findIndex(
      (player) => player.playerId === oldPlayerId,
    );

    if (oldPlayerIndex === -1) {
      throw new NotFoundException(
        'The player to replace is not in this division',
      );
    }

    const newPlayer = await this.playerRepository.findOne({
      where: {
        playerId: newPlayerId,
      },
    });

    if (!newPlayer) {
      throw new NotFoundException(
        'The new player was not found',
      );
    }

    const newPlayerAlreadyAdded = division.players.some(
      (player) => player.playerId === newPlayerId,
    );

    if (newPlayerAlreadyAdded) {
      throw new ConflictException(
        'The new player is already in this division',
      );
    }

    division.players[oldPlayerIndex] = newPlayer;

    await this.divisionRepository.save(division);

    return {
      success: true,
      message: 'Player replaced successfully',
      divisionId: division.divisionId,
      removedPlayerId: oldPlayerId,
      addedPlayerId: newPlayer.playerId,
      playerCount: division.players.length,
      status: division.Status,
    };
  }

  // =====================================================
  // UPDATE DIVISION DETAILS
  // Status and players cannot be changed through this route.
  // Start League should control the status transition.
  // =====================================================

  async update(
    divisionId: string,
    divisionData: Partial<Division>,
  ) {
    const division = await this.findOne(divisionId);

    const editableData: Partial<Division> = {
      ...divisionData,
    };

    // Prevent bypassing the Start League process.
    delete editableData.Status;
    delete editableData.players;
    delete editableData.id;
    delete editableData.divisionId;
    delete editableData.competitionId;
    delete editableData.createdAt;
    delete editableData.updatedAt;

    if (editableData.divisionNumber !== undefined) {
      if (editableData.divisionNumber === 1) {
        editableData.name =
          'Thrill Seekers Premier League';
      } else if (editableData.divisionNumber === 2) {
        editableData.name =
          'Thrill Seekers Championship';
      } else if (editableData.divisionNumber === 3) {
        editableData.name =
          'Thrill Seekers League One';
      } else {
        editableData.name =
          `Thrill Seekers Division ${editableData.divisionNumber}`;
      }
    }

    Object.assign(division, editableData);

    return this.divisionRepository.save(division);
  }

  // =====================================================
  // DELETE DIVISION
  // =====================================================

  async remove(divisionId: string) {
    const division = await this.findOne(divisionId);

    // Delete all point-table rows belonging to this division.
    await this.pointTableRepository.delete({
      competitionId: division.competitionId,
    });

    await this.divisionRepository.remove(division);

    return {
      success: true,
      message: 'Division deleted successfully',
    };
  }

  // =====================================================
  // SEND RUNNING LEAGUE EMAILS
  // Existing behavior preserved.
  // =====================================================

  async sendRunningLeagueEmails() {
    const divisions = await this.divisionRepository.find({
      relations: {
        players: true,
      },
      order: {
        divisionNumber: 'ASC',
      },
    });

    const runningDivisions = divisions.filter(
      (division) =>
        String(division.Status ?? '').toUpperCase() ===
          'ACTIVE' &&
        division.divisionId === 'DIV-0008',
    );

    if (runningDivisions.length === 0) {
      throw new NotFoundException(
        'No running league found',
      );
    }

    let totalPlayers = 0;
    let sentEmails = 0;
    let failedEmails = 0;

    const failedPlayers: string[] = [];

    for (const division of runningDivisions) {
      const amount = this.getDivisionFee(
        division.divisionNumber,
      );

      for (const player of division.players || []) {
        totalPlayers++;

        if (!player.email) {
          failedEmails++;

          failedPlayers.push(
            `${player.playerId} - email not found`,
          );

          continue;
        }

        try {
          await this.mailService.sendLeagueParticipationEmail(
            player.email,
            player.name,
            player.playerId,
            division.name,
            amount,
          );

          sentEmails++;
        } catch (error) {
          failedEmails++;

          failedPlayers.push(
            `${player.playerId} - email sending failed`,
          );
        }
      }
    }

    return {
      success: true,
      message: 'Running league emails processed successfully',

      runningLeagues: runningDivisions.map(
        (division) => ({
          divisionId: division.divisionId,
          divisionName: division.name,
          playerCount: division.players?.length || 0,
        }),
      ),

      totalPlayers,
      sentEmails,
      failedEmails,
      failedPlayers,
    };
  }

  // =====================================================
  // CHECK DIVISION STATUS
  // =====================================================

  private ensureDivisionIsInProgress(
    division: Division,
  ): void {
    const status = String(
      division.Status ?? '',
    ).trim().toUpperCase();

    if (status !== 'IN_PROGRESS') {
      throw new ConflictException(
        'Players can only be added, removed, or replaced before the league starts',
      );
    }
  }

  // =====================================================
  // DIVISION FEE
  // =====================================================

  private getDivisionFee(
    divisionNumber?: number,
  ): number {
    if (divisionNumber === 1) {
      return 50;
    }

    if (divisionNumber === 2) {
      return 40;
    }

    if (divisionNumber === 3) {
      return 30;
    }

    throw new ConflictException(
      `Invalid division number: ${divisionNumber}`,
    );
  }
}
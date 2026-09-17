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

@Injectable()
export class DivisionService {
  constructor(
    @InjectRepository(Division)
    private readonly divisionRepository: Repository<Division>,

    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,

    @InjectRepository(PointTable)
    private readonly pointTableRepository: Repository<PointTable>,
  ) {}

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

    const division = this.divisionRepository.create({
      ...divisionData,
      divisionId,
      competitionId: divisionId,
      name,
    });

    return this.divisionRepository.save(division);
  }

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

  async addPlayer(
    divisionId: string,
    playerId: string,
  ) {
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

    const player = await this.playerRepository.findOne({
      where: {
        playerId,
      },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    // Check whether player is already in this division
    const alreadyAdded = division.players.some(
      (divisionPlayer) =>
        divisionPlayer.playerId === playerId,
    );

    if (alreadyAdded) {
      throw new ConflictException(
        'Player is already in this division',
      );
    }

    // Add player to division
    division.players.push(player);

    await this.divisionRepository.save(division);

    // Check whether point-table row already exists
    const existingPointTableRow =
      await this.pointTableRepository.findOne({
        where: {
          competitionId: division.competitionId,
          playerId: playerId,
        },
      });

    // Create initial point-table row
    if (!existingPointTableRow) {
      const pointTableRow =
        this.pointTableRepository.create({
          competitionId: division.competitionId,
          playerId: playerId,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        });

      await this.pointTableRepository.save(
        pointTableRow,
      );
    }

    return {
      success: true,
      message:
        'Player added to division and point table successfully',
      divisionId: division.divisionId,
      playerId: player.playerId,
    };
  }

  async removePlayer(
    divisionId: string,
    playerId: string,
  ) {
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

    // Also remove player's point-table row
    await this.pointTableRepository.delete({
      competitionId: division.competitionId,
      playerId: playerId,
    });

    return {
      success: true,
      message:
        'Player removed from division successfully',
    };
  }

  async update(
    divisionId: string,
    divisionData: Partial<Division>,
  ) {
    const division = await this.findOne(divisionId);

    if (
      divisionData.divisionNumber !== undefined
    ) {
      if (divisionData.divisionNumber === 1) {
        divisionData.name =
          'Thrill Seekers Premier League';
      } else if (divisionData.divisionNumber === 2) {
        divisionData.name =
          'Thrill Seekers Championship';
      } else if (divisionData.divisionNumber === 3) {
        divisionData.name =
          'Thrill Seekers League One';
      } else {
        divisionData.name =
          `Thrill Seekers Division ${divisionData.divisionNumber}`;
      }
    }

    Object.assign(division, divisionData);

    return this.divisionRepository.save(division);
  }

  async remove(divisionId: string) {
    const division = await this.findOne(divisionId);

    // Remove all point-table rows belonging
    // to this division
    await this.pointTableRepository.delete({
      competitionId: division.competitionId,
    });

    await this.divisionRepository.remove(division);

    return {
      message: 'Division deleted successfully',
    };
  }
}
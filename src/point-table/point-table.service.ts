import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PointTable } from './point-table.entity.js';

@Injectable()
export class PointTableService {
  constructor(
    @InjectRepository(PointTable)
    private readonly pointTableRepository: Repository<PointTable>,
    private readonly dataSource: DataSource,
  ) {}

  // Create one PointTable row for every player in a competition.
  async createForCompetition(
    competitionId: string,
    playerIds: string[],
  ): Promise<PointTable[]> {
    if (!playerIds.length) {
      throw new BadRequestException('At least one player is required');
    }

    const uniquePlayerIds = [...new Set(playerIds)];

    const rows = uniquePlayerIds.map((playerId) =>
      this.pointTableRepository.create({
        competitionId,
        playerId,
      }),
    );

    return this.pointTableRepository.save(rows);
  }

  async findByCompetition(competitionId: string): Promise<PointTable[]> {
    return this.pointTableRepository.find({
      where: { competitionId },
      order: {
        points: 'DESC',
        goalDifference: 'DESC',
        goalsFor: 'DESC',
      },
    });
  }

  async findOne(
    competitionId: string,
    playerId: string,
  ): Promise<PointTable> {
    const row = await this.pointTableRepository.findOne({
      where: { competitionId, playerId },
    });

    if (!row) {
      throw new NotFoundException('Point table row not found');
    }

    return row;
  }

  // Call this after a match is completed.
  // homeScore and awayScore are final scores.
  async applyMatchResult(params: {
    competitionId: string;
    homePlayerId: string;
    awayPlayerId: string;
    homeScore: number;
    awayScore: number;
  }): Promise<void> {
    const {
      competitionId,
      homePlayerId,
      awayPlayerId,
      homeScore,
      awayScore,
    } = params;

    if (homePlayerId === awayPlayerId) {
      throw new BadRequestException(
        'A player cannot play against himself',
      );
    }

    if (homeScore < 0 || awayScore < 0) {
      throw new BadRequestException('Scores cannot be negative');
    }

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(PointTable);

      const home = await repo.findOne({
        where: {
          competitionId,
          playerId: homePlayerId,
        },
      });

      const away = await repo.findOne({
        where: {
          competitionId,
          playerId: awayPlayerId,
        },
      });

      if (!home || !away) {
        throw new NotFoundException(
          'Both players must exist in the competition point table',
        );
      }

      home.played += 1;
      away.played += 1;

      home.goalsFor += homeScore;
      home.goalsAgainst += awayScore;

      away.goalsFor += awayScore;
      away.goalsAgainst += homeScore;

      if (homeScore > awayScore) {
        home.won += 1;
        home.points += 3;
        away.lost += 1;
      } else if (homeScore < awayScore) {
        away.won += 1;
        away.points += 3;
        home.lost += 1;
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
      }

      home.goalDifference =
        home.goalsFor - home.goalsAgainst;

      away.goalDifference =
        away.goalsFor - away.goalsAgainst;

      await repo.save([home, away]);
    });
  }

  // Useful if you ever need to rebuild the table from match history.
  async resetCompetition(
    competitionId: string,
  ): Promise<void> {
    await this.pointTableRepository.update(
      { competitionId },
      {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      },
    );
  }
}
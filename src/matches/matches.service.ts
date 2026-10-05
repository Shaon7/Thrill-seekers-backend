import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  DataSource,
  Repository,
} from 'typeorm';

import {
  Match,
  MatchStatus,
} from './matches.entity.js';

import { Division } from '../division/division.entity.js';

import { Player } from '../player/player.entity.js';

import { PointTable } from '../point-table/point-table.entity.js';

import { PaymentService } from '../payment/payment.service.js';
import { NotificationService } from '../notification/notification.service.js';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,

    @InjectRepository(Division)
    private readonly divisionRepository: Repository<Division>,

    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,

    @InjectRepository(PointTable)
    private readonly pointTableRepository: Repository<PointTable>,

    private readonly paymentService: PaymentService,

    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  // =========================================================
  // CREATE ONE MATCH
  // =========================================================

  async create(matchData: Partial<Match>) {
    const matches =
      await this.matchRepository.find({
        order: {
          id: 'DESC',
        },
        take: 1,
      });

    let nextNumber = 1;

    if (matches.length > 0) {
      nextNumber =
        matches[0].id + 1;
    }

    const matchId =
      `MAT-${String(nextNumber).padStart(4, '0')}`;

    const match =
      this.matchRepository.create({
        ...matchData,
        matchId,
        status:
          MatchStatus.SCHEDULED,
      });

    return this.matchRepository.save(
      match,
    );
  }

  // =========================================================
  // ALL MATCHES
  // =========================================================

  async findAll() {
    return this.matchRepository.find({
      order: {
        round: 'ASC',
        id: 'ASC',
      },
    });
  }

  // =========================================================
  // MATCHES BY COMPETITION
  // =========================================================

  async findByCompetition(
    competitionId: string,
  ) {
    return this.matchRepository.find({
      where: {
        competitionId,
      },
      order: {
        round: 'ASC',
        id: 'ASC',
      },
    });
  }

  // =========================================================
  // FIND ONE MATCH
  // =========================================================

  async findOne(matchId: string) {
    const match =
      await this.matchRepository.findOne({
        where: {
          matchId,
        },
      });

    if (!match) {
      throw new NotFoundException(
        'Match not found',
      );
    }

    return match;
  }

  // =========================================================
  // GET ALL ADMINS
  // =========================================================

  async findAdmins() {
    return this.playerRepository.find({
      where: {
        isAdmin: true,
      },
      order: {
        id: 'ASC',
      },
    });
  }

  // =========================================================
  // ASSIGN ADMIN TO MATCH
  // ONLY SUPERADMIN SHOULD CALL THIS
  // =========================================================

  async assignAdmin(
    matchId: string,
    adminPlayerId: string,
  ) {
    const match =
      await this.findOne(matchId);

    const admin =
      await this.playerRepository.findOne({
        where: {
          playerId: adminPlayerId,
          isAdmin: true,
        },
      });

    if (!admin) {
      throw new NotFoundException(
        'Admin player not found',
      );
    }

    match.assignedAdminId =
      admin.playerId;

    const savedMatch =
      await this.matchRepository.save(
        match,
      );

    return {
      success: true,
      message:
        'Admin assigned to match successfully.',
      match: savedMatch,
      assignedAdmin: {
        playerId: admin.playerId,
        name: admin.name,
        email: admin.email,
      },
    };
  }

  // =========================================================
  // UPDATE MATCH
  // =========================================================

  async update(
    matchId: string,
    matchData: Partial<Match>,
  ) {
    const match =
      await this.findOne(matchId);

    Object.assign(
      match,
      matchData,
    );

    return this.matchRepository.save(
      match,
    );
  }

  // =========================================================
  // DELETE MATCH
  // =========================================================

  async remove(matchId: string) {
    const match =
      await this.findOne(matchId);

    await this.matchRepository.remove(
      match,
    );

    return {
      message:
        'Match deleted successfully',
    };
  }

  // =========================================================
  // SUBMIT MATCH RESULT
  // =========================================================

  async submitResult(
    matchId: string,
    homeScore: number,
    awayScore: number,
    currentUser: {
      id: number;
      playerId?: string;
      userType?: string;
      isAdmin?: boolean;
    },
  ) {
    // -----------------------------------------------
    // Validate scores
    // -----------------------------------------------

    if (
      !Number.isInteger(homeScore) ||
      !Number.isInteger(awayScore)
    ) {
      throw new BadRequestException(
        'Scores must be whole numbers.',
      );
    }

    if (
      homeScore < 0 ||
      awayScore < 0
    ) {
      throw new BadRequestException(
        'Scores cannot be negative.',
      );
    }

    // -----------------------------------------------
    // Find match
    // -----------------------------------------------

    const match =
      await this.matchRepository.findOne({
        where: {
          matchId,
        },
      });

    if (!match) {
      throw new NotFoundException(
        'Match not found',
      );
    }

    // -----------------------------------------------
    // Match status
    // -----------------------------------------------

    if (
      match.status ===
      MatchStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'This match result has already been submitted.',
      );
    }

    if (
      match.status ===
      MatchStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cancelled matches cannot have a result.',
      );
    }

    // =================================================
    // PERMISSION CHECK
    // =================================================

    const userType =
      currentUser.userType?.toLowerCase();

    // SuperAdmin can submit any match
    if (userType === 'superadmin') {
      // allowed
    }

    // Admin can submit any match
    else if (currentUser.isAdmin) {
      if (!currentUser.playerId) {
        throw new ForbiddenException(
          'Admin player information not found.',
        );
      }

            
    }

    // Home/Away player
    else {
      if (!currentUser.playerId) {
        throw new ForbiddenException(
          'Player information not found.',
        );
      }

      const isHomePlayer =
        match.homePlayerId ===
        currentUser.playerId;

      const isAwayPlayer =
        match.awayPlayerId ===
        currentUser.playerId;

      if (
        !isHomePlayer &&
        !isAwayPlayer
      ) {
        throw new ForbiddenException(
          'You can only submit the result of your own match.',
        );
      }
    }

    // =================================================
    // UPDATE MATCH + POINT TABLE IN ONE TRANSACTION
    // =================================================

    await this.dataSource.transaction(
      async (manager) => {
        const matchRepo =
          manager.getRepository(Match);

        const pointTableRepo =
          manager.getRepository(
            PointTable,
          );

        const home =
          await pointTableRepo.findOne({
            where: {
              competitionId:
                match.competitionId,

              playerId:
                match.homePlayerId,
            },
          });

        const away =
          await pointTableRepo.findOne({
            where: {
              competitionId:
                match.competitionId,

              playerId:
                match.awayPlayerId,
            },
          });

        if (!home || !away) {
          throw new NotFoundException(
            'Point table records for both players were not found.',
          );
        }

        // ---------------------------------------------
        // Update match
        // ---------------------------------------------

        match.homeScore =
          homeScore;

        match.awayScore =
          awayScore;

        match.status =
          MatchStatus.COMPLETED;

        // ---------------------------------------------
        // Update played
        // ---------------------------------------------

        home.played += 1;
        away.played += 1;

        // ---------------------------------------------
        // Update goals
        // ---------------------------------------------

        home.goalsFor +=
          homeScore;

        home.goalsAgainst +=
          awayScore;

        away.goalsFor +=
          awayScore;

        away.goalsAgainst +=
          homeScore;

        // ---------------------------------------------
        // Winner / loser / draw
        // ---------------------------------------------

        if (
          homeScore > awayScore
        ) {
          home.won += 1;
          home.points += 3;

          away.lost += 1;
        } else if (
          homeScore < awayScore
        ) {
          away.won += 1;
          away.points += 3;

          home.lost += 1;
        } else {
          home.drawn += 1;
          away.drawn += 1;

          home.points += 1;
          away.points += 1;
        }

        // ---------------------------------------------
        // Goal Difference
        // ---------------------------------------------

        home.goalDifference =
          home.goalsFor -
          home.goalsAgainst;

        away.goalDifference =
          away.goalsFor -
          away.goalsAgainst;

        // ---------------------------------------------
        // Save
        // ---------------------------------------------

        await matchRepo.save(match);

        await pointTableRepo.save([
          home,
          away,
        ]);
      },
    );

    try {
  await this.notificationService.notifyMatchResultSubmitted(
    match.matchId,
    match.homePlayerId,
    match.awayPlayerId,
    homeScore,
    awayScore,
  );
} catch (error) {
  console.error(
    'Match result notification failed:',
    error,
  );
}

    return {
      success: true,
      message:
        'Match result submitted successfully.',
      matchId:
        match.matchId,
      homePlayerId:
        match.homePlayerId,
      awayPlayerId:
        match.awayPlayerId,
      homeScore,
      awayScore,
      status:
        MatchStatus.COMPLETED,
    };
  }

  // =========================================================
  // GENERATE DOUBLE ROUND-ROBIN MATCHES
  // =========================================================

    async generateDivisionMatches(
  divisionId: string,
) {
  const division =
    await this.divisionRepository.findOne({
      where: {
        divisionId,
      },
      relations: {
        players: true,
      },
    });

  if (!division) {
    throw new NotFoundException(
      'Division not found',
    );
  }

  const players =
    division.players || [];

  if (players.length < 2) {
    throw new BadRequestException(
      'At least 2 players are required to generate matches.',
    );
  }

  // Prevent duplicate generation
  const existingMatches =
    await this.matchRepository.find({
      where: {
        competitionId:
          division.competitionId,
      },
    });

  if (existingMatches.length > 0) {
    return {
      success: true,
      message:
        'Matches have already been generated for this division.',
      competitionId:
        division.competitionId,
      matchCount:
        existingMatches.length,
      matches:
        existingMatches,
    };
  }

  const playerIds =
    players.map(
      (player) =>
        player.playerId,
    );

  // Add BYE for odd number of players
  const rotation =
    [...playerIds];

  if (rotation.length % 2 !== 0) {
    rotation.push('BYE');
  }

  const totalPlayers =
    rotation.length;

  const roundsPerLeg =
    totalPlayers - 1;

  const matchesPerRound =
    totalPlayers / 2;

  const totalRounds =
    roundsPerLeg * 2;

  // =====================================================
  // MATCH DATE
  // One full day break before first match
  // =====================================================

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0,
  );

  // First match day is tomorrow
  let matchDate =
    new Date(today);

  matchDate.setDate(
    matchDate.getDate() + 1,
  );

  // Friday is a match-free day
  while (
    matchDate.getDay() === 5
  ) {
    matchDate.setDate(
      matchDate.getDate() + 1,
    );
  }

  // =====================================================
  // GET NEXT MATCH NUMBER
  // =====================================================

  const latestMatch =
    await this.matchRepository.find({
      order: {
        id: 'DESC',
      },
      take: 1,
    });

  let nextMatchNumber = 1;

  if (
    latestMatch.length > 0
  ) {
    nextMatchNumber =
      latestMatch[0].id + 1;
  }

  const matchData:
    Partial<Match>[] = [];

  let currentRotation = [
    ...rotation,
  ];

  // =====================================================
  // GENERATE FIRST LEG
  // =====================================================

  for (
    let round = 1;
    round <= roundsPerLeg;
    round++
  ) {
    // Friday = no match
    while (
      matchDate.getDay() === 5
    ) {
      matchDate.setDate(
        matchDate.getDate() + 1,
      );
    }

    // Deadline is the next day at 2:00 AM
    const roundDeadline =
      new Date(matchDate);

    roundDeadline.setDate(
      roundDeadline.getDate() + 1,
    );

    roundDeadline.setHours(
      2,
      0,
      0,
      0,
    );

    for (
      let i = 0;
      i < matchesPerRound;
      i++
    ) {
      const home =
        currentRotation[i];

      const away =
        currentRotation[
          totalPlayers -
            1 -
            i
        ];

      if (
        home === 'BYE' ||
        away === 'BYE'
      ) {
        continue;
      }

      matchData.push({
        competitionId:
          division.competitionId,

        homePlayerId:
          home,

        awayPlayerId:
          away,

        homeScore: 0,

        awayScore: 0,

        assignedAdminId:
          "Not- Assigned",

        round,

        deadline:
          new Date(roundDeadline),

        status:
          MatchStatus.SCHEDULED,
      });
    }

    // Rotate
    const fixed =
      currentRotation[0];

    const rotating =
      currentRotation.slice(1);

    rotating.unshift(
      rotating.pop()!,
    );

    currentRotation = [
      fixed,
      ...rotating,
    ];

    // Move to next match day
    matchDate.setDate(
      matchDate.getDate() + 1,
    );

    // Skip Friday
    while (
      matchDate.getDay() === 5
    ) {
      matchDate.setDate(
        matchDate.getDate() + 1,
      );
    }
  }

  // =====================================================
  // GENERATE SECOND LEG
  // =====================================================

  currentRotation = [
    ...rotation,
  ];

  for (
    let legRound = 1;
    legRound <= roundsPerLeg;
    legRound++
  ) {
    const round =
      roundsPerLeg +
      legRound;

    // Friday = no match
    while (
      matchDate.getDay() === 5
    ) {
      matchDate.setDate(
        matchDate.getDate() + 1,
      );
    }

    // Deadline is the next day at 2:00 AM
    const roundDeadline =
      new Date(matchDate);

    roundDeadline.setDate(
      roundDeadline.getDate() + 1,
    );

    roundDeadline.setHours(
      2,
      0,
      0,
      0,
    );

    for (
      let i = 0;
      i < matchesPerRound;
      i++
    ) {
      const home =
        currentRotation[i];

      const away =
        currentRotation[
          totalPlayers -
            1 -
            i
        ];

      if (
        home === 'BYE' ||
        away === 'BYE'
      ) {
        continue;
      }

      matchData.push({
        competitionId:
          division.competitionId,

        // Reverse home/away in second leg
        homePlayerId:
          away,

        awayPlayerId:
          home,

        homeScore: 0,

        awayScore: 0,

        assignedAdminId:
          "Not- Assigned",

        round,

        deadline:
          new Date(roundDeadline),

        status:
          MatchStatus.SCHEDULED,
      });
    }

    // Rotate
    const fixed =
      currentRotation[0];

    const rotating =
      currentRotation.slice(1);

    rotating.unshift(
      rotating.pop()!,
    );

    currentRotation = [
      fixed,
      ...rotating,
    ];

    // Move to next match day
    matchDate.setDate(
      matchDate.getDate() + 1,
    );

    // Skip Friday
    while (
      matchDate.getDay() === 5
    ) {
      matchDate.setDate(
        matchDate.getDate() + 1,
      );
    }
  }

  // =====================================================
  // SAVE MATCHES
  // =====================================================

  const matches =
    matchData.map(
      (data, index) => {
        return this.matchRepository.create(
          {
            ...data,

            matchId:
              `MAT-${String(
                nextMatchNumber +
                  index,
              ).padStart(
                4,
                '0',
              )}`,
          },
        );
      },
    );

  const savedMatches =
    await this.matchRepository.save(
      matches,
    );

  // =====================================================
  // CREATE DIVISION PAYMENTS
  // =====================================================

  const payments = [];

  for (const player of players) {
    const payment =
      await this.paymentService.createDivisionFee(
        player.playerId,
        division.divisionId,
        division.divisionNumber,
      );

    payments.push(payment);
  }

  return {
    success: true,
    message:
      'Division matches generated successfully.',
    competitionId:
      division.competitionId,
    matchCount:
      savedMatches.length,
    rounds:
      totalRounds,
    matches:
      savedMatches,
  };
}
  async changeMatchTime(
    matchId: string,
    newDate: string,
  ) {
    const match =
      await this.findOne(matchId);

    if (
      match.status !==
      MatchStatus.SCHEDULED
    ) {
      throw new BadRequestException(
        'Only scheduled matches can be rescheduled.',
      );
    }

    const selectedDate =
      new Date(
        `${newDate}T00:00:00`,
      );

    if (
      Number.isNaN(
        selectedDate.getTime(),
      )
    ) {
      throw new BadRequestException(
        'Invalid date.',
      );
    }

    const currentDeadline =
      new Date(
        match.deadline,
      );

    selectedDate.setHours(
      currentDeadline.getHours(),
      currentDeadline.getMinutes(),
      currentDeadline.getSeconds(),
      currentDeadline.getMilliseconds(),
    );

    match.deadline =
      selectedDate;

    match.status =
      MatchStatus.RESCHEDULED;

    const savedMatch =
      await this.matchRepository.save(
        match,
      );

    return {
      success: true,
      message:
        'Match rescheduled successfully.',
      match: savedMatch,
    };
  }
}
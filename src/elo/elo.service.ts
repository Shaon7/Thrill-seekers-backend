import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  DataSource,
  Repository,
} from 'typeorm';

import {
  EloRatingHistory,
} from './elo-rating-history.entity.js';

import {
  Match,
  MatchStatus,
} from '../matches/matches.entity.js';

import {
  Player,
} from '../player/player.entity.js';

@Injectable()
export class EloService {
  private readonly initialRating = 1000;
  private readonly kFactor = 32;

  constructor(
    private readonly dataSource: DataSource,
  ) {}

  // =====================================================
  // EXPECTED SCORE
  // =====================================================

  private calculateExpectedScore(
    playerRating: number,
    opponentRating: number,
  ): number {
    return (
      1 /
      (
        1 +
        Math.pow(
          10,
          (opponentRating - playerRating) / 400,
        )
      )
    );
  }

  // =====================================================
  // ACTUAL SCORE
  // =====================================================

  private getActualScore(
    playerScore: number,
    opponentScore: number,
  ): number {
    if (playerScore > opponentScore) {
      return 1;
    }

    if (playerScore < opponentScore) {
      return 0;
    }

    return 0.5;
  }

  // =====================================================
  // NEW RATING
  // =====================================================

  private calculateNewRating(
    currentRating: number,
    opponentRating: number,
    actualScore: number,
  ): number {
    const expectedScore =
      this.calculateExpectedScore(
        currentRating,
        opponentRating,
      );

    return (
      currentRating +
      this.kFactor *
        (actualScore - expectedScore)
    );
  }

  // =====================================================
  // ROUND TO 2 DECIMAL PLACES
  // =====================================================

  private roundRating(
    rating: number,
  ): number {
    return Number(
      rating.toFixed(2),
    );
  }

  // =====================================================
  // APPLY ONE MATCH
  // =====================================================

  private async applyMatch(
    match: Match,
    playerRepository: Repository<Player>,
    historyRepository: Repository<EloRatingHistory>,
  ) {
    const homePlayer =
      await playerRepository.findOne({
        where: {
          playerId:
            match.homePlayerId,
        },
      });

    const awayPlayer =
      await playerRepository.findOne({
        where: {
          playerId:
            match.awayPlayerId,
        },
      });

    if (!homePlayer) {
      throw new NotFoundException(
        `Player ${match.homePlayerId} not found.`,
      );
    }

    if (!awayPlayer) {
      throw new NotFoundException(
        `Player ${match.awayPlayerId} not found.`,
      );
    }

    const homeOldRating =
      Number(homePlayer.rating);

    const awayOldRating =
      Number(awayPlayer.rating);

    const homeActualScore =
      this.getActualScore(
        match.homeScore,
        match.awayScore,
      );

    const awayActualScore =
      this.getActualScore(
        match.awayScore,
        match.homeScore,
      );

    const homeNewRating =
      this.roundRating(
        this.calculateNewRating(
          homeOldRating,
          awayOldRating,
          homeActualScore,
        ),
      );

    const awayNewRating =
      this.roundRating(
        this.calculateNewRating(
          awayOldRating,
          homeOldRating,
          awayActualScore,
        ),
      );

    homePlayer.rating =
      homeNewRating;

    awayPlayer.rating =
      awayNewRating;

    await playerRepository.save([
      homePlayer,
      awayPlayer,
    ]);

    const homeHistory =
      historyRepository.create({
        matchId:
          match.matchId,

        playerId:
          homePlayer.playerId,

        oldRating:
          homeOldRating,

        newRating:
          homeNewRating,

        ratingChange:
          this.roundRating(
            homeNewRating -
              homeOldRating,
          ),

        round:
          match.round,

        competitionId:
          match.competitionId,
      });

    const awayHistory =
      historyRepository.create({
        matchId:
          match.matchId,

        playerId:
          awayPlayer.playerId,

        oldRating:
          awayOldRating,

        newRating:
          awayNewRating,

        ratingChange:
          this.roundRating(
            awayNewRating -
              awayOldRating,
          ),

        round:
          match.round,

        competitionId:
          match.competitionId,
      });

    await historyRepository.save([
      homeHistory,
      awayHistory,
    ]);
  }

  // =====================================================
  // RECALCULATE GLOBAL RATINGS
  // =====================================================

  async rebuildGlobalRatings(): Promise<void> {
    await this.dataSource.transaction(
      async (manager) => {
        const playerRepository =
          manager.getRepository(Player);

        const matchRepository =
          manager.getRepository(Match);

        const historyRepository =
          manager.getRepository(
            EloRatingHistory,
          );

        // -----------------------------------------------
        // Reset every player's rating
        // -----------------------------------------------

        await playerRepository
          .createQueryBuilder()
          .update(Player)
          .set({
            rating:
              this.initialRating,
            ranking: null,
          })
          .execute();

        // -----------------------------------------------
        // Remove old Elo history
        // -----------------------------------------------

        await historyRepository.clear();

        // -----------------------------------------------
        // Get every completed match
        // -----------------------------------------------

        const completedMatches =
          await matchRepository.find({
            where: {
              status:
                MatchStatus.COMPLETED,
            },
            order: {
              deadline: 'ASC',
              id: 'ASC',
            },
          });

        // -----------------------------------------------
        // Replay every completed match
        // -----------------------------------------------

        for (
          const match of completedMatches
        ) {
          await this.applyMatch(
            match,
            playerRepository,
            historyRepository,
          );
        }

        // -----------------------------------------------
        // Calculate global ranking
        // -----------------------------------------------

        const players = await playerRepository.find({
  order: {
    rating: 'DESC',
    id: 'ASC',
  },
});

// Players who have played at least one completed match
const history = await historyRepository.find({
  select: {
    playerId: true,
  },
});

const playedPlayerIds = new Set(
  history.map(
    (item) => item.playerId,
  ),
);

// Only players who have played are ranked
const rankedPlayers = players.filter(
  (player) =>
    playedPlayerIds.has(
      player.playerId,
    ),
);

// Players who have not played remain unranked
for (const player of players) {
  if (
    !playedPlayerIds.has(
      player.playerId,
    )
  ) {
    player.ranking = null;
  }
}

let currentRank = 1;

for (
  let index = 0;
  index < rankedPlayers.length;
  index++
) {
  if (
    index > 0 &&
    Number(
      rankedPlayers[index].rating,
    ) !==
      Number(
        rankedPlayers[index - 1].rating,
      )
  ) {
    currentRank = index + 1;
  }

  rankedPlayers[index].ranking =
    currentRank;
}

await playerRepository.save(players);
      }
    );
  }

  // =====================================================
  // GET GLOBAL RANKING
  // =====================================================

  async getGlobalRanking() {
    return this.dataSource
      .getRepository(Player)
      .find({
        order: {
          ranking: 'ASC',
        },
      });
  }
}
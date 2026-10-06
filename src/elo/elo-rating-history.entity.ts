import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('elo_rating_history')
export class EloRatingHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  matchId: string;

  @Column()
  playerId: string;

  @Column({
    type: 'double precision',
  })
  oldRating: number;

  @Column({
    type: 'double precision',
  })
  newRating: number;

  @Column({
    type: 'double precision',
  })
  ratingChange: number;

  @Column()
  round: number;

  @Column()
  competitionId: string;

  @CreateDateColumn()
  createdAt: Date;
}
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('point_tables')
@Unique('UQ_point_table_competition_player', ['competitionId', 'playerId'])
export class PointTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'competition_id', type: 'varchar' })
  competitionId: string;

  @Index()
  @Column({ name: 'player_id', type: 'varchar' })
  playerId: string;

  @Column({ type: 'int', default: 0 })
  played: number;

  @Column({ type: 'int', default: 0 })
  won: number;

  @Column({ type: 'int', default: 0 })
  drawn: number;

  @Column({ type: 'int', default: 0 })
  lost: number;

  @Column({ name: 'goals_for', type: 'int', default: 0 })
  goalsFor: number;

  @Column({ name: 'goals_against', type: 'int', default: 0 })
  goalsAgainst: number;

  @Column({ name: 'goal_difference', type: 'int', default: 0 })
  goalDifference: number;

  @Column({ type: 'int', default: 0 })
  points: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
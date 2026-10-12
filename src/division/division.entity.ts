import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Player } from '../player/player.entity.js';

@Entity('divisions')
export class Division {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  divisionId: string;

  @Column({ unique: true })
  competitionId: string;

  @Column({ nullable: true })
  NumberOfPlayer: number;

  @Column()
  season: number;

  @Column()
  phase: number;

  @Column()
  divisionNumber: number;

  @Column()
  name: string;

  // IN_PROGRESS = roster setup; ACTIVE = league has started.
  // Existing active divisions should remain ACTIVE.
  @Column({ type: 'varchar', length: 30, nullable: true, default: 'IN_PROGRESS' })
  Status: string;

  @ManyToMany(() => Player)
  @JoinTable()
  players: Player[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

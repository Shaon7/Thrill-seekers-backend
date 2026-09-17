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

  @Column({nullable:true})
  NumberOfPlayer:  number

  @Column()
  season: number;

  @Column()
  phase: number;

  @Column()
  divisionNumber: number;

  @Column()
  name: string;

  @Column({nullable:true,default:'Active'})
  Status:String

  @ManyToMany(() => Player)
  @JoinTable()
  players: Player[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
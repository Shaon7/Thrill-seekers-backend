import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} 
from 'typeorm';import { ManyToMany } from 'typeorm';
import { Division } from '../division/division.entity.js';

@Entity('player')
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  playerId: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ unique: true })
  konamiId: string;

  @Column()
  deviceName: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({
  type: 'varchar',
  nullable: true,
})
passwordResetCode: string | null;

@Column({
  type: 'timestamp',
  nullable: true,
})
passwordResetCodeExpiresAt: Date | null;

  @ManyToMany(() => Division, (division) => division.players)
  divisions: Division[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;


}
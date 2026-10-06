import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum NotificationType {
  PAYMENT = 'PAYMENT',
  MATCH_RESULT = 'MATCH_RESULT',
  SYSTEM = 'SYSTEM',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  playerId: string | null;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  link: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  recipientId: string;

  @Column({
    default: false,
  })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
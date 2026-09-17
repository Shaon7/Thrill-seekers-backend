import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum PaymentType {
  DIVISION_FEE = 'DIVISION_FEE',
  FINE = 'FINE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  playerId: string;

  @Column()
  divisionId: string;

  @Column('decimal', {
    precision: 10,
    scale: 2,
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentType,
  })
  paymentType: PaymentType;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  senderBkashNumber: string;

  @Column({
    nullable: true,
    unique: true,
  })
  transactionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'varchar', nullable: true })
rejectionReason: string | null;

@Column({ type: 'timestamp', nullable: true })
verifiedAt: Date | null;

@Column({ type: 'varchar', nullable: true })
verifiedBy: string | null;
}
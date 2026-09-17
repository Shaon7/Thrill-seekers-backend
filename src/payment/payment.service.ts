import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Payment,
  PaymentStatus,
  PaymentType,
} from './payment.entity.js';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  // =====================================================
  // GET DIVISION FEE
  // =====================================================

  private getDivisionFee(
    divisionNumber: number,
  ): number {
    if (divisionNumber === 1) {
      return 50;
    }

    if (divisionNumber === 2) {
      return 40;
    }

    if (divisionNumber === 3) {
      return 30;
    }

    throw new BadRequestException(
      'Invalid division number.',
    );
  }

  // =====================================================
  // CREATE DIVISION FEE
  // Called when a player is added to a division
  // =====================================================

  async createDivisionFee(
    playerId: string,
    divisionId: string,
    divisionNumber: number,
  ) {
    const existingPayment =
      await this.paymentRepository.findOne({
        where: {
          playerId,
          divisionId,
          paymentType: PaymentType.DIVISION_FEE,
        },
      });

    if (existingPayment) {
      return existingPayment;
    }

    const amount =
      this.getDivisionFee(divisionNumber);

    const payment =
      this.paymentRepository.create({
        playerId,
        divisionId,
        amount,
        paymentType:
          PaymentType.DIVISION_FEE,
        status: PaymentStatus.PENDING,
      });

    return this.paymentRepository.save(
      payment,
    );
  }

  // =====================================================
  // CREATE FINE
  // For future manual fine management
  // =====================================================

    async createFine(
  playerId: string,
  amount: number,
  reason?: string,
) {
  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new BadRequestException(
      'Fine amount must be greater than 0.',
    );
  }

  const payment =
    this.paymentRepository.create({
      playerId,
      divisionId: '',
      amount,
      paymentType:
        PaymentType.FINE,
      status:
        PaymentStatus.PENDING,
      rejectionReason:
        reason || undefined,
    });

  return this.paymentRepository.save(
    payment,
  );
}
  // =====================================================
  // PLAYER SUBMITS PAYMENT
  // =====================================================

    async submitPayment(
  paymentId: number,
  playerId: string,
  senderBkashNumber: string,
  transactionId: string,
) {
  const payment =
    await this.paymentRepository.findOne({
      where: {
        id: paymentId,
      },
    });

  if (!payment) {
    throw new NotFoundException(
      'Payment not found.',
    );
  }

  if (
    payment.playerId !==
    playerId
  ) {
    throw new BadRequestException(
      'You can only submit your own payment.',
    );
  }

  // PENDING can be submitted normally.
  // REJECTED can be submitted again.
  if (
    payment.status !==
      PaymentStatus.PENDING &&
    payment.status !==
      PaymentStatus.REJECTED
  ) {
    throw new BadRequestException(
      'Payment has already been processed.',
    );
  }

  if (
    !senderBkashNumber?.trim()
  ) {
    throw new BadRequestException(
      'bKash number is required.',
    );
  }

  if (
    !transactionId?.trim()
  ) {
    throw new BadRequestException(
      'Transaction ID is required.',
    );
  }

  const cleanBkashNumber =
    senderBkashNumber.trim();

  const cleanTransactionId =
    transactionId.trim();

  const existingTransaction =
    await this.paymentRepository.findOne(
      {
        where: {
          transactionId:
            cleanTransactionId,
        },
      },
    );

  // Allow the same payment record to be updated,
  // but do not allow another payment to use
  // the same transaction ID.
  if (
    existingTransaction &&
    existingTransaction.id !==
      payment.id
  ) {
    throw new BadRequestException(
      'This transaction ID has already been used.',
    );
  }

  payment.senderBkashNumber =
    cleanBkashNumber;

  payment.transactionId =
    cleanTransactionId;

  payment.status =
    PaymentStatus.PENDING;

  // Clear the previous rejection because
  // the player has submitted a new payment.
  payment.rejectionReason =
    null;

  payment.verifiedAt = null;

  payment.verifiedBy =
    null ;

  return this.paymentRepository.save(
    payment,
  );
}
      
      
     
  // =====================================================
  // GET MY PAYMENTS
  // =====================================================

  async findMyPayments(
    playerId: string,
  ) {
    return this.paymentRepository.find({
      where: {
        playerId,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  // =====================================================
  // GET ALL PAYMENTS
  // ADMIN / SUPERADMIN
  // =====================================================

  async findAll() {
    return this.paymentRepository.find({
      order: {
        id: 'DESC',
      },
    });
  }

  // =====================================================
  // GET ONE PAYMENT
  // =====================================================

  async findOne(id: number) {
    const payment =
      await this.paymentRepository.findOne({
        where: {
          id,
        },
      });

    if (!payment) {
      throw new NotFoundException(
        'Payment not found.',
      );
    }

    return payment;
  }

  // =====================================================
  // VERIFY PAYMENT
  // =====================================================

  async verify(
    id: number,
    verifiedBy: string,
  ) {
    const payment =
      await this.findOne(id);

    if (
      payment.status !==
      PaymentStatus.PENDING
    ) {
      throw new BadRequestException(
        'Only pending payments can be verified.',
      );
    }

    payment.status =
      PaymentStatus.PAID;

    payment.verifiedAt =
      new Date();

    payment.verifiedBy =
      verifiedBy;

    payment.rejectionReason =
      " ";

    return this.paymentRepository.save(
      payment,
    );
  }

  // =====================================================
  // REJECT PAYMENT
  // =====================================================

  async reject(
    id: number,
    rejectionReason: string,
    verifiedBy: string,
  ) {
    const payment =
      await this.findOne(id);

    if (
      payment.status !==
      PaymentStatus.PENDING
    ) {
      throw new BadRequestException(
        'Only pending payments can be rejected.',
      );
    }

    if (
      !rejectionReason ||
      !rejectionReason.trim()
    ) {
      throw new BadRequestException(
        'Rejection reason is required.',
      );
    }

    payment.status =
      PaymentStatus.REJECTED;

    payment.rejectionReason =
      rejectionReason.trim();

    payment.verifiedAt =
      new Date();

    payment.verifiedBy =
      verifiedBy;

    return this.paymentRepository.save(
      payment,
    );
  }
}
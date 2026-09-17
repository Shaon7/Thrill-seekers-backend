import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';

import type { Request } from 'express';

import { PaymentService } from './payment.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { SuperAdminGuard } from '../auth/super-admin.guard.js';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
  ) {}

  // =====================================================
  // SUBMIT PAYMENT DETAILS
  // PLAYER
  // =====================================================

  @Post(':paymentId/submit')
  @UseGuards(JwtAuthGuard)
  submitPayment(
    @Param(
      'paymentId',
      ParseIntPipe,
    )
    paymentId: number,

    @Body()
    body: {
      senderBkashNumber: string;
      transactionId: string;
    },

    @Req() req: Request,
  ) {
    const user = req.user as any;

    const playerId = user?.playerId;

    if (!playerId) {
      throw new UnauthorizedException(
        'Player information was not found in your login session.',
      );
    }

    return this.paymentService.submitPayment(
      paymentId,
      playerId,
      body.senderBkashNumber,
      body.transactionId,
    );
  }

  // =====================================================
  // MY PAYMENTS
  // PLAYER
  // =====================================================

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMyPayments(
    @Req() req: Request,
  ) {
    const user = req.user as any;

    const playerId = user?.playerId;

    if (!playerId) {
      throw new UnauthorizedException(
        'Player information was not found in your login session.',
      );
    }

    return this.paymentService.findMyPayments(
      playerId,
    );
  }

  // =====================================================
  // ALL PAYMENTS
  // SUPERADMIN ONLY
  // =====================================================

  @Get()
  @UseGuards(
    JwtAuthGuard,
    SuperAdminGuard,
  )
  findAll() {
    return this.paymentService.findAll();
  }

  // =====================================================
  // GET ONE PAYMENT
  // SUPERADMIN ONLY
  // =====================================================

  @Get(':paymentId')
  @UseGuards(
    JwtAuthGuard,
    SuperAdminGuard,
  )
  findOne(
    @Param(
      'paymentId',
      ParseIntPipe,
    )
    paymentId: number,
  ) {
    return this.paymentService.findOne(
      paymentId,
    );
  }

  // =====================================================
  // VERIFY PAYMENT
  // SUPERADMIN ONLY
  // =====================================================

  @Patch(':paymentId/verify')
  @UseGuards(
    JwtAuthGuard,
    SuperAdminGuard,
  )
  verify(
    @Param(
      'paymentId',
      ParseIntPipe,
    )
    paymentId: number,

    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.paymentService.verify(
      paymentId,
      user?.playerId ||
        user?.email ||
        'superadmin',
    );
  }

  // =====================================================
  // REJECT PAYMENT
  // SUPERADMIN ONLY
  // =====================================================

  @Patch(':paymentId/reject')
  @UseGuards(
    JwtAuthGuard,
    SuperAdminGuard,
  )
  reject(
    @Param(
      'paymentId',
      ParseIntPipe,
    )
    paymentId: number,

    @Body()
    body: {
      rejectionReason: string;
    },

    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.paymentService.reject(
      paymentId,
      body.rejectionReason,
      user?.playerId ||
        user?.email ||
        'superadmin',
    );
  }

  // =====================================================
  // CREATE FINE
  // SUPERADMIN ONLY
  // =====================================================

  @Post('fine')
  @UseGuards(
    JwtAuthGuard,
    SuperAdminGuard,
  )
  createFine(
    @Body()
    body: {
      playerId: string;
      amount: number;
      reason?: string;
    },
  ) {
    return this.paymentService.createFine(
      body.playerId,
      body.amount,
      body.reason,
    );
  }
}
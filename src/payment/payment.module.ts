import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service.js';
import { PaymentController } from './payment.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity.js';
import { AuthModule } from '../auth/auth.module.js';


@Module({

  imports:[AuthModule,
    TypeOrmModule.forFeature([Payment])],
  controllers:[PaymentController],
  providers: [PaymentService],
   exports: [
    PaymentService,
  ],
})
export class PaymentModule {}

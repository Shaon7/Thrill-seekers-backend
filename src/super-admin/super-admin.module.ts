import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SuperAdmin } from './super-admin.entity.js';
import { SuperAdminController } from './super-admin.controller.js';
import { SuperAdminService } from './super-admin.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([SuperAdmin]),
  ],

  controllers: [
    SuperAdminController,
  ],

  providers: [
    SuperAdminService,
  ],

  exports: [
    SuperAdminService,
  ],
})
export class SuperAdminModule {}
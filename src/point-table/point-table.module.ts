import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointTable } from './point-table.entity.js';
import { PointTableController } from './point-table.controller.js';
import { PointTableService } from './point-table.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
    
    imports:[AuthModule,
        TypeOrmModule.forFeature([PointTable])],
    controllers:[PointTableController],
    providers:[PointTableService]
})
export class PointTableModule {}

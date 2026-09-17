import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { SuperAdmin } from './super-admin.entity.js';
@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(SuperAdmin)
    private readonly superAdminRepository: Repository<SuperAdmin>,
  ) {}

  async create(superAdminData: Partial<SuperAdmin>) {
    const existingSuperAdmin =
      await this.superAdminRepository.findOne({
        where: {
          email: superAdminData.email,
        },
      });

    if (existingSuperAdmin) {
      throw new ConflictException(
        'SuperAdmin with this email already exists',
      );
    }

    if (!superAdminData.password) {
      throw new ConflictException(
        'Password is required',
      );
    }

    const hashedPassword = await bcrypt.hash(
      superAdminData.password,
      10,
    );

    const superAdmin = this.superAdminRepository.create({
      ...superAdminData,
      password: hashedPassword,
    });

    return await this.superAdminRepository.save(superAdmin);
  }
}
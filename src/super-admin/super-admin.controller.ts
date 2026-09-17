import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { SuperAdminService } from './super-admin.service.js';

@Controller('superadmin')
export class SuperAdminController {
  constructor(
    private readonly superAdminService: SuperAdminService,
  ) {}

  @Post()
  async create(@Body() body: {
    name: string;
    email: string;
    password: string;
  }) {
    return this.superAdminService.create(body);
  }
}
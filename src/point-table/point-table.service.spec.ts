import { Test, TestingModule } from '@nestjs/testing';
import { PointTableService } from './point-table.service.js';

describe('PointTableService', () => {
  let service: PointTableService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PointTableService],
    }).compile();

    service = module.get<PointTableService>(PointTableService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

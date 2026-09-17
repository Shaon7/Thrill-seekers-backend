import { Test, TestingModule } from '@nestjs/testing';
import { PointTableController } from './point-table.controller.js';

describe('PointTableController', () => {
  let controller: PointTableController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointTableController],
    }).compile();

    controller = module.get<PointTableController>(PointTableController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

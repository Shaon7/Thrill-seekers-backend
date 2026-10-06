import { Test, TestingModule } from '@nestjs/testing';
import { EloController } from './elo.controller.js';

describe('EloController', () => {
  let controller: EloController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EloController],
    }).compile();

    controller = module.get<EloController>(EloController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

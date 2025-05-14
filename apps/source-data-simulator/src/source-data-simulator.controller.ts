import { Controller, Get } from '@nestjs/common';
import { SourceDataSimulatorService } from './source-data-simulator.service';

@Controller()
export class SourceDataSimulatorController {
  constructor(
    private readonly sourceDataSimulatorService: SourceDataSimulatorService,
  ) {}

  @Get()
  getHello(): string {
    return this.sourceDataSimulatorService.getHello();
  }
}

import { SourceDataSimulatorModule } from './source-data-simulator.module';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(SourceDataSimulatorModule);
  await app.listen(3002);
}
bootstrap();

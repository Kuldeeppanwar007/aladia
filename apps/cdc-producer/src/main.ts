import { NestFactory } from '@nestjs/core';
import { CdcProducerModule } from './cdc-producer.module';

async function bootstrap() {
  const app = await NestFactory.create(CdcProducerModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();

import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private microservice: MicroserviceHealthIndicator,
    private configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    // This health check for the microservice itself is more about it being responsive.
    // If it's a TCP microservice, you might check its own internal state or dependencies.
    // For simplicity, we'll just return a success.
    // A more robust check might involve a dummy message pattern to itself.
    return { status: 'ok', service: 'authentication-microservice' };
  }

  // This is a more complex health check if the microservice needs to check its own TCP listener
  // For now, the above simple check is fine.
  // @Get('tcp')
  // @HealthCheck()
  // checkTcp() {
  //     return this.health.check([
  //         () => this.microservice.pingCheck<MicroserviceOptions>('tcp-auth', {
  //             transport: Transport.TCP,
  //             options: {
  //                 host: this.configService.get<string>('AUTH_MICROSERVICE_HOST'),
  //                 port: this.configService.get<number>('AUTH_MICROSERVICE_PORT'),
  //             },
  //         }),
  //     ]);
  // }
}

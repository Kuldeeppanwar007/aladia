import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheck,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
    private configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    const gatewayPort = this.configService.get<number>('GATEWAY_PORT');
    console.log('Health check initiated');
    console.log(gatewayPort);
    return this.health.check([
      // Check if the gateway itself is responsive on its HTTP port
      () =>
        this.http.pingCheck(
          'gateway-http',
          `http://localhost:${gatewayPort}/api/docs`,
        ), // /api is for swagger
      // Check the health of the Authentication microservice
      () =>
        this.microservice.pingCheck<MicroserviceOptions>(
          'auth-microservice-tcp',
          {
            transport: Transport.TCP,
            options: {
              host: this.configService.get<string>('AUTH_MICROSERVICE_HOST'),
              port: this.configService.get<number>('AUTH_MICROSERVICE_PORT'),
            },
          },
        ),
    ]);
  }
}

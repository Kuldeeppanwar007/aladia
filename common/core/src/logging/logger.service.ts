import {
  Injectable,
  LoggerService as NestLoggerService,
  Scope,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable({ scope: Scope.TRANSIENT }) // Transient scope for context-specific logging if needed
export class LoggerService implements NestLoggerService {
  private context?: string;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    if (
      this.configService.get<string>('LOG_LEVEL') === 'debug' ||
      this.configService.get<string>('LOG_LEVEL') === 'log'
    ) {
      console.log(
        `[${context || this.context || 'Application'}] LOG: `,
        message,
      );
    }
  }

  error(message: any, trace?: string, context?: string) {
    console.error(
      `[${context || this.context || 'Application'}] ERROR: `,
      message,
      trace,
    );
  }

  warn(message: any, context?: string) {
    if (
      this.configService.get<string>('LOG_LEVEL') === 'debug' ||
      this.configService.get<string>('LOG_LEVEL') === 'log' ||
      this.configService.get<string>('LOG_LEVEL') === 'warn'
    ) {
      console.warn(
        `[${context || this.context || 'Application'}] WARN: `,
        message,
      );
    }
  }

  debug?(message: any, context?: string) {
    if (this.configService.get<string>('LOG_LEVEL') === 'debug') {
      console.debug(
        `[${context || this.context || 'Application'}] DEBUG: `,
        message,
      );
    }
  }

  verbose?(message: any, context?: string) {
    // For NestJS verbose logging
    if (
      this.configService.get<string>('LOG_LEVEL') === 'verbose' ||
      this.configService.get<string>('LOG_LEVEL') === 'debug'
    ) {
      console.log(
        `[${context || this.context || 'Application'}] VERBOSE: `,
        message,
      );
    }
  }
}

import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { LoginResponseRto } from '../rto/user-response.rto'; // Gateway RTO

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'defaultSecret',
    });
  }

  async validate(payload: {
    email: string;
    sub: string;
  }): Promise<LoginResponseRto> {
    // `payload.sub` contains the userId
    const user = await firstValueFrom(
      this.authClient.send<LoginResponseRto>(
        { cmd: 'auth_validate_user' },
        { userId: payload.sub },
      ),
    );
    if (!user) {
      throw new UnauthorizedException('User not found or token invalid');
    }
    // You can return a subset of user information or the full user object
    // Ensure the returned object structure matches what your guards/decorators expect
    return user;
  }
}

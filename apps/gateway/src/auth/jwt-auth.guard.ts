/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Add custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): any {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      // console.error('JWT Guard Error:', err, 'Info:', info, 'User:', user);
      throw (
        err ||
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        new UnauthorizedException(info?.message || 'User is not authenticated')
      );
    }
    return user; // This user object will be available as request.user
  }
}

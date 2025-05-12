/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Catch,
  RpcExceptionFilter as NestRpcExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class RpcExceptionFilter
  implements NestRpcExceptionFilter<RpcException>
{
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    // const request = ctx.getRequest();

    const error = exception.getError();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred with a downstream service.';

    if (typeof error === 'object' && error !== null) {
      status = (error as any).status || status;
      message = (error as any).message || message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // If the error object has a 'details' property, it might contain more specific info
    // For example, class-validator errors from the microservice
    const details = (error as any).details || undefined;

    // Log the error internally
    console.error(
      `RPC Exception Caught: Status: ${status}, Message: ${message}`,
      details ? `Details: ${JSON.stringify(details)}` : '',
    );

    if (host.getType() === 'http') {
      response.status(status).json({
        statusCode: status,
        message: message,
        error: HttpStatus[status] || 'Internal Server Error',
        details: details, // Send validation details back if present
        timestamp: new Date().toISOString(),
        path: ctx.getRequest().url,
      });
      return new Observable(); // Or just don't return anything for HTTP
    } else {
      // For other contexts (e.g. WebSockets, gRPC if you were using them),
      // you might want to re-throw or handle differently.
      // For TCP, the error is typically propagated back to the client.send() observable.
      return throwError(() => exception.getError());
    }
  }
}

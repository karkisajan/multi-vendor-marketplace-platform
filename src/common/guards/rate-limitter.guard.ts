import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class RatelimitterGuard extends ThrottlerGuard {
  private readonly logger = new Logger(RatelimitterGuard.name);

  protected throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const request = context
      .switchToHttp()
      .getRequest<
        Request & { ip?: string; socket: { remoteAddress?: string } }
      >();

    this.logger.warn(
      `Too many requests. IP: ${request.ip} URL: ${request.url}`,
    );

    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many attempts. Please try again later.',
        retryAfter: Math.ceil(throttlerLimitDetail.timeToExpire / 1000),
        endpoint: request.url,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  protected getTracker(req: Request): Promise<string> {
    const forwarded: string | string[] | undefined =
      req.headers['x-forwarded-for'];

    const forwardedIpAddress: string | string[] | undefined = Array.isArray(
      forwarded,
    )
      ? forwarded[0]
      : forwarded;

    const ipAddress: string =
      req.ip ?? forwardedIpAddress ?? req.socket.remoteAddress ?? 'unknown';
    const requestUrl = req.url ? req.originalUrl : '';

    return Promise.resolve(`${ipAddress}/${requestUrl}`);
  }
}

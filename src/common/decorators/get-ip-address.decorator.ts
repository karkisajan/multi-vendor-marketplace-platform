import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const GetIpAddress = createParamDecorator(
  (_: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<
      Request & {
        ip?: string;
        socket: { remoteAddress?: string };
      }
    >();

    const forwarded: string | string[] | undefined =
      request.headers['x-forwarded-for'];

    const forwardedIpAddress: string | string[] | undefined = Array.isArray(
      forwarded,
    )
      ? forwarded[0]
      : forwarded;

    const ipAddress: string =
      request.ip ??
      forwardedIpAddress ??
      request.socket.remoteAddress ??
      'unknown';

    return ipAddress;
  },
);

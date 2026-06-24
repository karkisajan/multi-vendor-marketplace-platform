import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const IpAddress = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx
      .switchToHttp()
      .getRequest<
        Request & { ip?: string; socket?: { remoteAddress?: string } }
      >();

    const forwarded: string | string[] | undefined =
      request.headers['x-forwarded-for'];

    const forwardedIpAddress: string | undefined = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded;

    return (
      request.ip ??
      forwardedIpAddress ??
      request.socket.remoteAddress ??
      'unknown'
    );
  },
);

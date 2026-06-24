import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface CurrentUserContext {
  id: string;
  email: string;
}

export const GetCurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): CurrentUserContext => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: CurrentUserContext }>();

    return request.user;
  },
);

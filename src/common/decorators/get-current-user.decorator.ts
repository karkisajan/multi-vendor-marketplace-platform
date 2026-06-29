import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { CurrentUserContext } from 'src/modules/users/types/user.types';

export const GetCurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): CurrentUserContext => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: CurrentUserContext }>();

    return request.user;
  },
);

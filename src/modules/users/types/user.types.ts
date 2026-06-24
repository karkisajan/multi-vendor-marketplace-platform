import { Request } from 'express';
import { UserRoleEnum } from 'src/common/enums/user-role.enum';

export interface CurrentUserContext {
  id: string;
  email: string;
  role: UserRoleEnum;
}

export interface JwtPayload {
  id: string;
  email: string;
}

export interface IGetUserAuthInfoRequest extends Request {
  user: JwtPayload;
}

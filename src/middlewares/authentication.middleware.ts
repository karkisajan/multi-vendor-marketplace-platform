import {
  Injectable,
  Logger,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
interface JwtPayload {
  id: string;
  email: string;
}
interface IGetUserAuthInfoRequest extends Request {
  user: JwtPayload;
}
@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthenticationMiddleware.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  use(req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) {
    const authHeadersToken: string | null = this.extractAuthHeadersToken(req);
    if (!authHeadersToken) {
      throw new UnauthorizedException('Invalid authenticaiton token.');
    }

    try {
      const verifiedAuthHeadersToken: JwtPayload =
        this.jwtService.verify<JwtPayload>(authHeadersToken, {
          secret: this.configService.get<string>('JWT_SECRET_KEY'),
        });

      req.user = verifiedAuthHeadersToken;

      next();
    } catch (error) {
      this.logger.log(error);
      throw new UnauthorizedException(
        `Invalid authentication token or token has expired.`,
      );
    }
  }

  private extractAuthHeadersToken = (req: Request): string | null => {
    const authHeaders = req.headers?.authorization;
    if (!authHeaders?.startsWith('Bearer ')) {
      return null;
    }

    return authHeaders.split(' ')[1];
  };
}

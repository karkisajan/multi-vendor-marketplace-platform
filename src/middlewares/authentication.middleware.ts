import {
  Injectable,
  Logger,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import {
  IGetUserAuthInfoRequest,
  JwtPayload,
} from 'src/modules/users/types/user.types';

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
      throw new UnauthorizedException(
        'Invalid authentication token. Please try again.',
      );
    }

    try {
      const verifiedAuthHeadersToken: JwtPayload =
        this.jwtService.verify<JwtPayload>(authHeadersToken, {
          secret: this.configService.get<string>('JWT_SECRET_KEY'),
        });

      if (!verifiedAuthHeadersToken.id || !verifiedAuthHeadersToken.email) {
        throw new UnauthorizedException(
          'Malformed authentication token payload.',
        );
      }

      req.user = verifiedAuthHeadersToken;
      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;

      if (error instanceof Error && error.name === 'TokenExpiredError') {
        this.logger.warn(
          `Jwt verification failed. Token has expired. Please login again. ${error}`,
        );
        throw new UnauthorizedException(
          'Authentication token has expired. Please login again.',
        );
      }

      this.logger.error(
        `Jwt verification failed. Missing authentication or token is invalid. ${error}`,
      );
      throw new UnauthorizedException(
        `Invalid authentication token. Please try again.`,
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

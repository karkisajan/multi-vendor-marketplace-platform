import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from 'src/modules/users/repositories/user.repository';
import * as argon from 'argon2';
import { UserRoleEnum } from 'src/common/enums/user-role.enum';
import { StringValue } from 'ms';

interface JwtPayload {
  id: string;
  email: string;
  role: UserRoleEnum;
}

@Injectable()
export class JwtTokenService {
  private readonly logger = new Logger(JwtTokenService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAndSaveToken(
    userId: string,
    jwtPayload: JwtPayload,
    secretKey: string | undefined,
    expiresIn: StringValue | undefined,
    tokenField: 'refreshToken' | 'resetPasswordToken',
    tokenDateField: 'refreshTokenExpiryDate' | 'resetPasswordTokenExpiryDate',
    date: Date,
  ) {
    const token = this.jwtService.sign(jwtPayload, {
      secret: secretKey,
      expiresIn: expiresIn,
    });

    const hashedToken: string = await argon.hash(token);
    const tokenExpiryDate: Date = date;

    await this.userRepository.update(userId, {
      [tokenField]: hashedToken,
      [tokenDateField]: tokenExpiryDate,
    });

    return token;
  }

  /**
   * Signs access and refresh JWT tokens, persists the hashed refresh token with expiry on the user record, and returns both tokens.
   */
  async jwtSignToken(id: string, email: string, role: UserRoleEnum) {
    try {
      const jwtPayload: JwtPayload = {
        id: id,
        email: email,
        role: role,
      };

      /* Access Token */
      const accessToken: string = this.jwtService.sign(jwtPayload, {
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
        expiresIn: '20m',
      });

      /* Refresh Token */
      const refreshToken: string = await this.generateAndSaveToken(
        id,
        jwtPayload,
        this.configService.get<string>('JWT_REFRESH_SECRET_KEY'),
        '7d',
        'refreshToken',
        'refreshTokenExpiryDate',
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      );

      return {
        message: 'User logged in successfully.',
        accessToken: accessToken,
        refreshToken: refreshToken,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate authentication tokens for user. ${error}`,
      );

      throw new InternalServerErrorException(
        'Authenticaiton process failed. Please try again.',
      );
    }
  }

  private verifyToken(
    token: string,
    secretKey: string | undefined,
  ): JwtPayload {
    try {
      const payload: JwtPayload = this.jwtService.verify<JwtPayload>(token, {
        secret: secretKey,
      });
      return payload;
    } catch (error) {
      this.logger.error(`Token is invalid or expired. ${error}`);
      throw new UnauthorizedException(
        'Token is invalid or expired. Please login to continue again.',
      );
    }
  }

  verifyRefreshToken(refreshToken: string): JwtPayload {
    return this.verifyToken(
      refreshToken,
      this.configService.get<string>('JWT_REFRESH_SECRET_KEY'),
    );
  }

  verifyResetToken(resetToken: string): JwtPayload {
    return this.verifyToken(
      resetToken,
      this.configService.get<string>('JWT_PASSWORD_RESET_SECRET_KEY'),
    );
  }
}

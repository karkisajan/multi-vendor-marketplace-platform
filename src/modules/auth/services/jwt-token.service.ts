import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from 'src/modules/users/repositories/user.repository';
import * as argon from 'argon2';

interface JwtPayload {
  id: string;
  email: string;
}

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Signs access and refresh JWT tokens, persists the hashed refresh token with expiry on the user record, and returns both tokens.
   */
  async jwtSignToken(id: string, email: string) {
    const jwtPayload: JwtPayload = {
      id: id,
      email: email,
    };

    /* Access Token */
    const accessToken: string = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get<string>('JWT_SECRET_KEY'),
      expiresIn: '7d',
    });

    /* Refresh Token */
    const refreshToken: string = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET_KEY'),
      expiresIn: '7d',
    });

    /* Hash the refresh-token and set the expiry date */
    const hashedRefreshToken: string = await argon.hash(refreshToken);
    const refreshTokenExpiryDate: Date = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    await this.userRepository.update(
      { id: id },
      {
        refreshToken: hashedRefreshToken,
        refreshTokenExpiryDate: refreshTokenExpiryDate,
      },
    );

    return {
      message: 'User logged in successfully.',
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }
}

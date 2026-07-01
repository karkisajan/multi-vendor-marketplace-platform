import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

export interface GoogleUser {
  provider: 'google';
  providerId: string;
  email: string;
  name: string;
  avatar: string;
  accessToken: string;
  refreshToken: string | undefined;
}

@Injectable()
export class GoogleAuthStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): GoogleUser {
    const { id, emails, photos, displayName } = profile;

    return {
      provider: 'google',
      providerId: id,
      email: emails?.[0].value ?? '',
      name: displayName,
      avatar: photos?.[0].value ?? '',
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }
}

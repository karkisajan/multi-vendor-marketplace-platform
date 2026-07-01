import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Profile, Strategy } from 'passport-facebook';

export interface FacebookUser {
  provider: 'facebook';
  providerId: string;
  email: string;
  name: string;
  avatar: string;
}

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('FACEBOOK_APP_ID'),
      clientSecret: configService.getOrThrow<string>('FACEBOOK_APP_SECRET'),
      callbackURL: configService.getOrThrow<string>('FACEBOOK_CALLBACK_URL'),
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'displayName', 'emails', 'photos'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): FacebookUser {
    const { id, displayName, emails, photos } = profile;

    return {
      provider: 'facebook',
      providerId: id,
      email: emails?.[0]?.value ?? '',
      name: displayName,
      avatar: photos?.[0]?.value ?? '',
    };
  }
}

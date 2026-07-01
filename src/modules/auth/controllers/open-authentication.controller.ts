import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { GoogleUser } from '../strategies/google-auth.strategy';
import { FacebookUser } from '../strategies/facebook-auth.strategy';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { FacebookAuthGuard } from '../guards/facebook-auth.guard';
import { GetIpAddress } from 'src/common/decorators/get-ip-address.decorator';
import {
  ApiGoogleAuth,
  ApiGoogleAuthCallback,
  ApiFacebookAuth,
  ApiFacebookAuthCallback,
} from '../decorators/open-auth-swagger.decorator';

@ApiTags('Open Auth')
@Controller('/auth')
export class OpenAuthenticationController {
  constructor(private readonly authService: AuthService) {}

  /** ----------- Google authentication */

  /**
   * GET - Initiate Google OAuth authentication flow.
   * Redirects the client to Google's sign-in/consent page.
   * Passport intercepts this route and issues the redirect automatically — no controller body is needed.
   */
  @Get('/google')
  @UseGuards(GoogleAuthGuard)
  @ApiGoogleAuth()
  googleAuthentication(): void {}

  /**
   * GET - Google OAuth Callback.
   * Called by Google after the user grants (or denies) consent.
   * Passport validates the returned authorization code, extracts the Google profile,
   * and attaches it as `req.user`. The service then signs in an existing user or
   * auto-registers a new customer account and issues application JWT tokens.
   */
  @Get('/google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiGoogleAuthCallback()
  async googleAuthenticationCallback(
    @Req() req: Request & { user: GoogleUser },
    @GetIpAddress() ipAddress: string,
  ) {
    return await this.authService.googleLogin(req.user, ipAddress);
  }

  /** ----------- Facebook authentication */

  /**
   * GET - Initiate Facebook OAuth authentication flow.
   * Redirects the client to Facebook's login page.
   * Passport intercepts this route and issues the redirect automatically — no controller body is needed.
   */
  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  @ApiFacebookAuth()
  facebookAuth(): void {}

  /**
   * GET - Facebook OAuth Callback.
   * Called by Facebook after the user logs in and grants permissions.
   * Passport validates the authorization code, extracts the Facebook profile,
   * and attaches it as `req.user`. The service then signs in an existing user or
   * auto-registers a new customer account and issues application JWT tokens.
   */
  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  @ApiFacebookAuthCallback()
  async facebookAuthCallback(
    @Req() req: Request & { user: FacebookUser },
    @GetIpAddress() ipAddress: string,
  ) {
    return await this.authService.facebookLogin(req.user, ipAddress);
  }
}

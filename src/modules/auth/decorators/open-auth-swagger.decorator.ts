import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * Swagger decorator for the GET /auth/google endpoint.
 * Documents the OAuth initiation step that redirects the client to Google's consent page.
 */
export function ApiGoogleAuth() {
  return applyDecorators(
    ApiTags('Open Auth'),
    ApiOperation({
      summary: 'Initiate Google OAuth flow',
      description:
        'Redirects the client browser to the Google sign-in / consent page. ' +
        'No request body is required. Passport handles the redirect automatically.',
    }),
    ApiResponse({
      status: 302,
      description:
        'Redirect to Google OAuth consent page. The browser is forwarded to Google for user authentication.',
    }),
  );
}

/**
 * Swagger decorator for the GET /auth/google/callback endpoint.
 * Documents the callback step where Google redirects back with an authorization code,
 * the user is authenticated or auto-registered, and JWT tokens are returned.
 */
export function ApiGoogleAuthCallback() {
  return applyDecorators(
    ApiTags('Open Auth'),
    ApiOperation({
      summary: 'Google OAuth callback',
      description:
        'Handles the redirect from Google after user consent. ' +
        'Passport validates the authorization code, exchanges it for a Google profile, ' +
        'then signs in an existing user or auto-registers a new customer account. ' +
        'Returns a pair of signed JWT access and refresh tokens together with the user profile.',
    }),
    ApiResponse({
      status: 200,
      description:
        'Authentication successful. Returns JWT access token, refresh token, and user profile.',
    }),
    ApiResponse({
      status: 400,
      description:
        'Bad request — Google did not return a valid user profile or email address.',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized — Google OAuth validation failed.',
    }),
  );
}

/**
 * Swagger decorator for the GET /auth/facebook endpoint.
 * Documents the OAuth initiation step that redirects the client to Facebook's login page.
 */
export function ApiFacebookAuth() {
  return applyDecorators(
    ApiTags('Open Auth'),
    ApiOperation({
      summary: 'Initiate Facebook OAuth flow',
      description:
        'Redirects the client browser to the Facebook login / permissions page. ' +
        'No request body is required. Passport handles the redirect automatically.',
    }),
    ApiResponse({
      status: 302,
      description:
        'Redirect to Facebook OAuth login page. The browser is forwarded to Facebook for user authentication.',
    }),
  );
}

/**
 * Swagger decorator for the GET /auth/facebook/callback endpoint.
 * Documents the callback step where Facebook redirects back after login,
 * the user is authenticated or auto-registered, and JWT tokens are returned.
 */
export function ApiFacebookAuthCallback() {
  return applyDecorators(
    ApiTags('Open Auth'),
    ApiOperation({
      summary: 'Facebook OAuth callback',
      description:
        'Handles the redirect from Facebook after user login. ' +
        'Passport validates the authorization code, exchanges it for a Facebook profile, ' +
        'then signs in an existing user or auto-registers a new customer account. ' +
        'Returns a pair of signed JWT access and refresh tokens together with the user profile.',
    }),
    ApiResponse({
      status: 200,
      description:
        'Authentication successful. Returns JWT access token, refresh token, and user profile.',
    }),
    ApiResponse({
      status: 400,
      description:
        'Bad request — Facebook did not return a valid user profile or email address.',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized — Facebook OAuth validation failed.',
    }),
  );
}

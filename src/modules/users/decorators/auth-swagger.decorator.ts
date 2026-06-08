import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RegisterCustomerDto } from 'src/modules/users/dto/register-customer.dto';
import { LoginUserDto } from 'src/modules/users/dto/login-user.dto';
import { RefreshTokenDto } from 'src/modules/users/dto/refresh-token.dto';

export function ApiRegisterUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Register a new user' }),
    ApiBody({ type: RegisterCustomerDto }),
    ApiResponse({
      status: 201,
      description: 'User registered successfully.',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request / Validation error',
    }),
    ApiResponse({
      status: 409,
      description: 'Email already exists',
    }),
  );
}

export function ApiLoginUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Login user' }),
    ApiBody({ type: LoginUserDto }),
    ApiResponse({
      status: 200,
      description: 'User logged in successfully.',
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid email or password',
    }),
  );
}

export function ApiRefreshToken() {
  return applyDecorators(
    ApiOperation({ summary: 'Refresh access token' }),
    ApiBody({ type: RefreshTokenDto }),
    ApiResponse({
      status: 200,
      description: 'Token refreshed successfully.',
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid or expired refresh token',
    }),
  );
}

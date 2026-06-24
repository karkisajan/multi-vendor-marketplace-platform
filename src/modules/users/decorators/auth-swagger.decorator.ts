import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RegisterCustomerDto } from 'src/modules/users/dto/auth/register-customer.dto';
import { LoginUserDto } from 'src/modules/users/dto/auth/login-user.dto';
import { RefreshTokenDto } from 'src/modules/users/dto/auth/refresh-token.dto';
import { ForgetPasswordDto } from 'src/modules/users/dto/auth/forget-password.dto';
import { ResetPasswordDto } from 'src/modules/users/dto/auth/reset-password.dto';

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

export function ApiForgetPassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Request password reset link' }),
    ApiBody({ type: ForgetPasswordDto }),
    ApiResponse({
      status: 200,
      description: 'Password reset link has been sent to your email.',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request / Validation error',
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid email',
    }),
  );
}

export function ApiResetPassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Reset password with token' }),
    ApiBody({ type: ResetPasswordDto }),
    ApiResponse({
      status: 200,
      description: 'Your password has been successfully reset',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request / Validation error',
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid email or expired reset token',
    }),
  );
}

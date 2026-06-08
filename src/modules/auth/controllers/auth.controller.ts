import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { ApiTags } from '@nestjs/swagger';
import { RegisterCustomerDto } from 'src/modules/users/dto/register-customer.dto';
import { LoginUserDto } from 'src/modules/users/dto/login-user.dto';
import { RefreshTokenDto } from 'src/modules/users/dto/refresh-token.dto';
import {
  ApiLoginUser,
  ApiRefreshToken,
  ApiRegisterUser,
} from 'src/modules/users/decorators/auth-swagger.decorator';
import { RegisterVendorDto } from 'src/modules/users/dto/register-vendor.dto';
import { ForgetPasswordDto } from 'src/modules/users/dto/forget-password.dto';
import { ResetPasswordDto } from 'src/modules/users/dto/reset-password.dto';

@ApiTags('Auth')
@Controller('/auth/users')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * ------ POST - Register user (Customer)
   * Accepts customer registration payload and delegates to AuthService.
   */
  @ApiRegisterUser()
  @Post('/register')
  async registerCustomer(@Body() registerUserDto: RegisterCustomerDto) {
    return await this.authService.registerCustomer(registerUserDto);
  }

  /**
   * ------ POST - Register user (Vendor)
   * Accepts vendor registration payload and delegates to AuthService.
   */
  @ApiRegisterUser()
  @Post('/vendor/register')
  async registerVendor(@Body() registerUserDto: RegisterVendorDto) {
    return await this.authService.registerVendor(registerUserDto);
  }

  /**
   * ------ POST - login user
   * Accepts login credentials and delegates authentication to AuthService.
   */
  @ApiLoginUser()
  @Post('/login')
  async loginUser(@Body() loginUserDto: LoginUserDto) {
    return await this.authService.loginUser(loginUserDto);
  }

  /**
   * ------ POST - refresh-token
   * Accepts a refresh token and delegates token renewal to AuthService.
   */
  @ApiRefreshToken()
  @Post('/refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto);
  }

  /**
   * ------ POST - forget password
   * Accepts the user email and delegates password reset initiation to AuthService.
   */
  @Post('/forget-password')
  async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    return await this.authService.forgetPassword(forgetPasswordDto);
  }

  /**
   * ------ POST - reset password
   * Accepts the reset token and new password; delegates password update to AuthService.
   */
  @Post('/reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }
}

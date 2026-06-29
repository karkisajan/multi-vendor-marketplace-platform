import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { ApiTags } from '@nestjs/swagger';
import { RegisterCustomerDto } from 'src/modules/users/dto/auth/register-customer.dto';
import { LoginUserDto } from 'src/modules/users/dto/auth/login-user.dto';
import { RefreshTokenDto } from 'src/modules/users/dto/auth/refresh-token.dto';
import {
  ApiForgetPassword,
  ApiLoginUser,
  ApiRefreshToken,
  ApiRegisterUser,
  ApiResetPassword,
} from 'src/modules/users/decorators/auth-swagger.decorator';
import { RegisterVendorDto } from 'src/modules/users/dto/auth/register-vendor.dto';
import { ForgetPasswordDto } from 'src/modules/users/dto/auth/forget-password.dto';
import { ResetPasswordDto } from 'src/modules/users/dto/auth/reset-password.dto';
import { RatelimitterGuard } from 'src/common/guards/rate-limitter.guard';
import { GetIpAddress } from 'src/common/decorators/get-ip-address.decorator';

@ApiTags('Auth')
@Controller('/auth/users')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * ------ POST - Register user (Customer)
   * Accepts customer registration payload and delegates to AuthService.
   */
  @ApiRegisterUser()
  @UseGuards(RatelimitterGuard)
  @Post('/register')
  async registerCustomer(
    @Body() registerUserDto: RegisterCustomerDto,
    @GetIpAddress() ipAddress: string,
  ) {
    return await this.authService.registerCustomer(registerUserDto, ipAddress);
  }

  /**
   * ------ POST - Register user (Vendor)
   * Accepts vendor registration payload and delegates to AuthService.
   */
  @ApiRegisterUser()
  @UseGuards(RatelimitterGuard)
  @Post('/vendor/register')
  async registerVendor(
    @Body() registerUserDto: RegisterVendorDto,
    @GetIpAddress() ipAddress: string,
  ) {
    return await this.authService.registerVendor(registerUserDto, ipAddress);
  }

  /**
   * ------ POST - login user
   * Accepts login credentials and delegates authentication to AuthService.
   */
  @ApiLoginUser()
  @UseGuards(RatelimitterGuard)
  @Post('/login')
  async loginUser(
    @Body() loginUserDto: LoginUserDto,
    @GetIpAddress() ipAddress: string,
  ) {
    return await this.authService.loginUser(loginUserDto, ipAddress);
  }

  /**
   * ------ POST - refresh-token
   * Accepts a refresh token and delegates token renewal to AuthService.
   */
  @ApiRefreshToken()
  @UseGuards(RatelimitterGuard)
  @Post('/refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto);
  }

  /**
   * ------ POST - forget password
   * Accepts the user email and delegates password reset initiation to AuthService.
   */
  @ApiForgetPassword()
  @UseGuards(RatelimitterGuard)
  @Post('/forget-password')
  async forgetPassword(
    @Body() forgetPasswordDto: ForgetPasswordDto,
    @GetIpAddress() ipAddress: string,
  ) {
    return await this.authService.forgetPassword(forgetPasswordDto, ipAddress);
  }

  /**
   * ------ POST - reset password
   * Accepts the reset token and new password; delegates password update to AuthService.
   */
  @ApiResetPassword()
  @UseGuards(RatelimitterGuard)
  @Post('/reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @GetIpAddress() ipAddress: string,
  ) {
    return await this.authService.resetPassword(resetPasswordDto, ipAddress);
  }
}

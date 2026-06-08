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

@ApiTags('Auth')
@Controller('/auth/users')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /* POST - Register user (Customer) */
  @ApiRegisterUser()
  @Post('/register')
  async registerCustomer(@Body() registerUserDto: RegisterCustomerDto) {
    return await this.authService.registerCustomer(registerUserDto);
  }

  /* POST - Register user (Vendor) */
  @ApiRegisterUser()
  @Post('/vendor/register')
  async registerVendor(@Body() registerUserDto: RegisterVendorDto) {
    return await this.authService.registerVendor(registerUserDto);
  }

  /* POST - login user */
  @ApiLoginUser()
  @Post('/login')
  async loginUser(@Body() loginUserDto: LoginUserDto) {
    return await this.authService.loginUser(loginUserDto);
  }

  /* POST - refresh-token */
  @ApiRefreshToken()
  @Post('/refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto);
  }
}

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from '../../users/repositories/user.repository';
import * as argon from 'argon2';
import { User } from 'src/modules/users/entities/user.entity';
import { CustomerProfileRepository } from 'src/modules/users/repositories/customer-profile.repository';
import { normalizedEmail } from 'src/common/utils/normalize-email.util';
import { DataSource, EntityManager } from 'typeorm';
import { LoginUserDto } from 'src/modules/users/dto/login-user.dto';
import { JwtTokenService } from './jwt-token.service';
import { RefreshTokenDto } from 'src/modules/users/dto/refresh-token.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MAIL_EVENTS } from 'src/mail/events/mail-event-names';
import {
  ForgetPasswordEvent,
  PasswordResetSuccessful,
  UserRegistrationEvent,
} from 'src/mail/events/mail.events';
import { RegisterVendorDto } from 'src/modules/users/dto/register-vendor.dto';
import { VendorProfileRepository } from 'src/modules/users/repositories/vendor-profile.repository';
import { VendorProfile } from 'src/modules/users/entities/vendor-profile.entity';
import { RegisterCustomerDto } from 'src/modules/users/dto/register-customer.dto';
import { CustomerProfile } from 'src/modules/users/entities/customer-profile.entity';
import { UserRoleEnum } from 'src/common/enums/user-role.enum';
import { ForgetPasswordDto } from 'src/modules/users/dto/forget-password.dto';
import { ResetPasswordDto } from 'src/modules/users/dto/reset-password.dto';

interface JwtPayload {
  id: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly customerProfileRepository: CustomerProfileRepository,
    private readonly vendorProfileRepository: VendorProfileRepository,
    private readonly jwtTokenService: JwtTokenService,

    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private checkPasswordMatches(
    registrationDto: RegisterCustomerDto | RegisterVendorDto,
  ): void {
    if (registrationDto.password !== registrationDto.confirmPassword) {
      throw new UnauthorizedException(
        'Passwords does not match. Please try again.',
      );
    }
  }

  private async checkEmailAlreadyExist(email: string): Promise<void> {
    const userExists: User | null = await this.userRepository.findUser(email);

    if (userExists) {
      throw new ConflictException('User with this email already exists.');
    }
  }

  private async jwtTokenResponse(user: User, role: UserRoleEnum) {
    const jwtTokenRes = await this.jwtTokenService.jwtSignToken(
      user.id,
      user.email,
    );

    return {
      ...jwtTokenRes,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile:
          role === UserRoleEnum.CUSTOMER
            ? {
                id: user.customerProfile.id,
                firstName: user.customerProfile.firstName,
                lastName: user.customerProfile.lastName,
                profileUrl: user.customerProfile.profileUrl,
                phoneNumber: user.customerProfile.phoneNumber,
              }
            : {
                id: user.vendorProfile.id,
                firstName: user.vendorProfile.businessName,
                profileUrl: user.vendorProfile.businessProfileUrl,
                phoneNumber: user.vendorProfile.phoneNumber,
              },
      },
    };
  }

  /* ------ POST - Register user (Customer) */
  async registerCustomer(registerCustomerDto: RegisterCustomerDto) {
    const result = await this.dataSource.transaction(
      async (manager: EntityManager) => {
        /* Check whether the confirm password and passwords should match */
        this.checkPasswordMatches(registerCustomerDto);

        /* Check whether the user with same email already exists */
        await this.checkEmailAlreadyExist(
          normalizedEmail(registerCustomerDto.email),
        );

        /* Hash password using ARGON*/
        const hashedPassword: string = await argon.hash(
          registerCustomerDto.password,
        );

        const savedUser: User = await this.userRepository.registerUser(
          normalizedEmail(registerCustomerDto.email),
          hashedPassword,
          manager,
        );

        const savedUserProfile: CustomerProfile =
          await this.customerProfileRepository.createUserProfile(
            registerCustomerDto,
            savedUser.id,
            manager,
          );

        return {
          message: 'User registered successfully.',
          id: savedUser.id,
          email: savedUser.email,
          role: savedUser.role,
          customerProfile: {
            id: savedUserProfile.id,
            firstName: savedUserProfile.firstName,
            lastName: savedUserProfile.lastName,
            profileUrl: savedUserProfile.profileUrl,
            phoneNumber: savedUserProfile.phoneNumber,
          },
        };
      },
    );

    /* Send Registration Email once user account created */
    this.eventEmitter.emit(
      MAIL_EVENTS.CUSTOMER_REGISTERED,
      new UserRegistrationEvent(
        result.email,
        `${result.customerProfile.firstName} ${result.customerProfile.lastName}`,
      ),
    );

    return result;
  }

  /* ------ POST - Register user (Customer) */
  async registerVendor(registerVendorDto: RegisterVendorDto) {
    const result = await this.dataSource.transaction(
      async (manager: EntityManager) => {
        /* Check whether the confirm password and passwords should match */
        this.checkPasswordMatches(registerVendorDto);

        /* Check whether the user with same email already exists */
        await this.checkEmailAlreadyExist(
          normalizedEmail(registerVendorDto.email),
        );

        /* Hash password using ARGON*/
        const hashedPassword: string = await argon.hash(
          registerVendorDto.password,
        );

        const savedVendor: User = await this.userRepository.registerUser(
          normalizedEmail(registerVendorDto.email),
          hashedPassword,
          manager,
          UserRoleEnum.VENDOR,
        );

        const savedVendorProfile: VendorProfile =
          await this.vendorProfileRepository.createVendorProfile(
            registerVendorDto,
            savedVendor.id,
            manager,
          );

        return {
          message: 'User registered successfully.',
          id: savedVendor.id,
          email: savedVendor.email,
          role: savedVendor.role,
          vendorProfile: {
            id: savedVendorProfile.id,
            businessName: savedVendorProfile.businessName,
            businessProfileUrl: savedVendorProfile.businessProfileUrl,
            phoneNumber: savedVendorProfile.phoneNumber,
          },
        };
      },
    );

    /* Send Registration Email once user account created */
    this.eventEmitter.emit(
      MAIL_EVENTS.VENDOR_REGISTERED,
      new UserRegistrationEvent(
        result.email,
        `${result.vendorProfile.businessName} ${result.vendorProfile.businessProfileUrl}`,
      ),
    );

    return result;
  }

  /* ------ POST - login user */
  async loginUser(loginUserDto: LoginUserDto) {
    const user: User | null = await this.userRepository.findUser(
      normalizedEmail(loginUserDto.email),
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    /* Verify the password */
    const isPasswordMatching: boolean = await argon.verify(
      user.password,
      loginUserDto.password,
    );
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return await this.jwtTokenResponse(user, user.role);
  }

  /* ------- POST - refresh-token */
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    const payload: JwtPayload = this.jwtService.verify<JwtPayload>(
      refreshToken,
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET_KEY'),
      },
    );

    const user: User | null = await this.userRepository.findUser(payload.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordVerified: boolean = await argon.verify(
      user.refreshToken,
      refreshToken,
    );
    if (!isPasswordVerified) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const currentDate: Date = new Date(Date.now());
    if (currentDate > user.refreshTokenExpiryDate) {
      throw new UnauthorizedException('Refresh token has expired.');
    }

    return await this.jwtTokenResponse(user, user.role);
  }

  /* ------ POST - forget password */
  async forgetPassword(forgetPasswordDto: ForgetPasswordDto) {
    const user: User | null = await this.userRepository.findUser(
      normalizedEmail(forgetPasswordDto.email),
    );
    if (!user) {
      throw new UnauthorizedException('Invalid email. Please try again.');
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
    };
    const resetToken: string = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_PASSWORD_RESET_SECRET_KEY'),
      expiresIn: '15m',
    });

    const hashedResetPasswordToken: string = await argon.hash(resetToken);
    const resetPasswordExpiryDate: Date = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );
    user.resetPasswordToken = hashedResetPasswordToken;
    user.resetPasswordTokenExpiryDate = resetPasswordExpiryDate;
    await this.userRepository.save(user);

    this.eventEmitter.emit(
      MAIL_EVENTS.PASSWORD_RESET,
      new ForgetPasswordEvent(
        user.email,
        `${user.customerProfile.firstName} ${user.customerProfile.lastName}`,
        resetToken,
      ),
    );

    return {
      message: 'Password reset link has been sent to your email.',
    };
  }

  /* ------ POST - reset password */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const payload: JwtPayload = this.jwtService.verify(
      resetPasswordDto.resetToken,
      {
        secret: this.configService.get<string>('JWT_PASSWORD_RESET_SECRET_KEY'),
      },
    );

    const user: User | null = await this.userRepository.findUser(
      normalizedEmail(payload.email),
    );
    if (!user) {
      throw new UnauthorizedException('Invalid email. Please try again.');
    }

    if (
      user &&
      (!user.resetPasswordTokenExpiryDate ||
        user.resetPasswordTokenExpiryDate < new Date(Date.now()))
    ) {
      throw new UnauthorizedException(
        'The reset token has expired. Please try again.',
      );
    }

    const hashedNewPassword: string = await argon.hash(
      resetPasswordDto.newPassword,
    );
    user.password = hashedNewPassword;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiryDate = null;
    await this.userRepository.save(user);

    this.eventEmitter.emit(
      MAIL_EVENTS.PASSWORD_RESET_SUCCESSFUL,
      new PasswordResetSuccessful(
        user.email,
        `${user.customerProfile.firstName} ${user.customerProfile.lastName}`,
      ),
    );

    return {
      message: 'Your password has been successfully reset',
    };
  }
}

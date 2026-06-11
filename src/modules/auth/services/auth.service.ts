import {
  BadRequestException,
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
import { AUTH_EVENTS } from 'src/mail/events/auth-event-names';
import {
  CustomerForgetPasswordEvent,
  CustomerPasswordResetSuccessfulEvent,
  UserLoggedInEvent,
  UserRegistrationEvent,
} from 'src/mail/events/auth.events';
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

  /**
   * Verifies that password and confirmPassword match; throws UnauthorizedException if not.
   */
  private checkPasswordMatches(
    registrationDto: RegisterCustomerDto | RegisterVendorDto,
  ): void {
    if (registrationDto.password !== registrationDto.confirmPassword) {
      throw new BadRequestException(
        'Passwords does not match. Please try again.',
      );
    }
  }

  /**
   * Checks whether a user with the given email already exists; throws ConflictException if found.
   */
  private async checkEmailAlreadyExist(email: string): Promise<void> {
    const userExists: User | null = await this.userRepository.findUser(email);

    if (userExists) {
      throw new ConflictException('User with this email already exists.');
    }
  }

  /**
   * Issues JWT tokens via JwtTokenService and shapes the login/refresh response with role-specific profile data.
   */
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
                businessName: user.vendorProfile.businessName,
                profileUrl: user.vendorProfile.businessProfileUrl,
                phoneNumber: user.vendorProfile.phoneNumber,
              },
      },
    };
  }

  /**
   * ------ POST - Register user (Customer)
   * Registers a new customer account and creates a customer profile within a single database transaction.
   * Emits a CUSTOMER_REGISTERED event after successful persistence.
   */
  async registerCustomer(
    registerCustomerDto: RegisterCustomerDto,
    userIpAddress: string,
  ) {
    const result = await this.dataSource.transaction(
      async (manager: EntityManager) => {
        this.checkPasswordMatches(registerCustomerDto);

        await this.checkEmailAlreadyExist(
          normalizedEmail(registerCustomerDto.email),
        );

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
      AUTH_EVENTS.CUSTOMER_REGISTERED,
      new UserRegistrationEvent(
        result.id,
        result.email,
        `${result.customerProfile.firstName} ${result.customerProfile.lastName}`,
        userIpAddress,
      ),
    );

    return result;
  }

  /**
   * ------ POST - Register user (Vendor)
   * Registers a new vendor account and creates a vendor profile within a single database transaction.
   * Emits a VENDOR_REGISTERED event after successful persistence.
   */
  async registerVendor(
    registerVendorDto: RegisterVendorDto,
    userIpAddress: string,
  ) {
    const result = await this.dataSource.transaction(
      async (manager: EntityManager) => {
        this.checkPasswordMatches(registerVendorDto);

        await this.checkEmailAlreadyExist(
          normalizedEmail(registerVendorDto.email),
        );

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
          message:
            'Vendor business account registered successfully. Please wait for your approval.',
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
      AUTH_EVENTS.VENDOR_REGISTERED,
      new UserRegistrationEvent(
        result.id,
        result.email,
        `${result.vendorProfile.businessName} ${result.vendorProfile.businessProfileUrl}`,
        userIpAddress,
      ),
    );

    return result;
  }

  /**
   * ------ POST - login user
   * Authenticates an existing customer or vendor by email and password; returns JWT tokens and profile on success.
   */
  async loginUser(loginUserDto: LoginUserDto, userIpAddress: string) {
    const user: User | null = await this.userRepository.findUser(
      normalizedEmail(loginUserDto.email),
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordMatching: boolean = await argon.verify(
      user.password,
      loginUserDto.password,
    );
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.role === UserRoleEnum.CUSTOMER) {
      this.eventEmitter.emit(
        AUTH_EVENTS.CUSTOMER_LOGGED_IN,
        new UserLoggedInEvent(
          user.id,
          user.email,
          `${user.customerProfile.firstName} ${user.customerProfile.lastName}`,
          userIpAddress,
        ),
      );
    }

    return await this.jwtTokenResponse(user, user.role);
  }

  /**
   * ------ POST - refresh-token
   * Exchanges a valid refresh token for a new access and refresh token pair without requiring re-login.
   * Verifies the JWT signature, confirms the token matches the argon2-hashed value stored on the user,
   * checks the stored expiry date, then re-issues tokens via jwtTokenResponse.
   * @throws UnauthorizedException when the user is not found, the token hash does not match, or the token has expired
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    /* Verify the refresh token payload with JwtRefreshTokenKey */
    const payload: JwtPayload = this.jwtService.verify<JwtPayload>(
      refreshToken,
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET_KEY'),
      },
    );

    /* GET user and verify the user-password */
    const user: User | null = await this.userRepository.findUser(payload.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email. Please try again.');
    }

    const isPasswordVerified: boolean = await argon.verify(
      user.refreshToken,
      refreshToken,
    );
    if (!isPasswordVerified) {
      throw new UnauthorizedException('Invalid password. Please try again.');
    }

    /* Verify the JwtTokenRefreshKey is past the date of current date */
    if (
      user &&
      (!user.refreshTokenExpiryDate ||
        user.refreshTokenExpiryDate < new Date(Date.now()))
    ) {
      throw new UnauthorizedException('Refresh token has expired.');
    }

    return await this.jwtTokenResponse(user, user.role);
  }

  /**
   * ------ POST - forget password
   * Initiates password recovery for an existing user by email.
   * Signs a short-lived JWT reset token (15m), persists its argon2 hash with a 7-day expiry window on the user record,
   * and emits CUSTOMER_FORGET_PASSWORD for customers (triggers the reset email and audit log).
   * @throws UnauthorizedException when no user exists for the given email
   */
  async forgetPassword(
    forgetPasswordDto: ForgetPasswordDto,
    userIpAddress: string,
  ) {
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

    if (user.role === UserRoleEnum.CUSTOMER) {
      this.eventEmitter.emit(
        AUTH_EVENTS.CUSTOMER_FORGET_PASSWORD,
        new CustomerForgetPasswordEvent(
          user.id,
          user.email,
          `${user.customerProfile.firstName} ${user.customerProfile.lastName}`,
          resetToken,
          userIpAddress,
        ),
      );
    }

    return {
      message: 'Password reset link has been sent to your email.',
    };
  }

  /**
   * ------ POST - reset password
   * Completes password recovery by validating the reset JWT, verifying the stored token hash and expiry,
   * hashing the new password, and clearing reset token fields from the user record.
   * Emits CUSTOMER_PASSWORD_RESET_SUCCESSFUL for customers (triggers the confirmation email and audit log).
   * @throws UnauthorizedException when the user is not found, no reset was requested, the token is invalid, or the token has expired
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    userIpAddress: string,
  ) {
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

    if (!user.resetPasswordToken) {
      throw new UnauthorizedException(
        'No password reset token was requested. Please try again.',
      );
    }
    const isVerifiedPassword: boolean = await argon.verify(
      user.resetPasswordToken,
      resetPasswordDto.resetToken,
    );
    if (!isVerifiedPassword) {
      throw new UnauthorizedException('Invalid password. Please try again.');
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

    if (user.role === UserRoleEnum.CUSTOMER) {
      this.eventEmitter.emit(
        AUTH_EVENTS.CUSTOMER_PASSWORD_RESET_SUCCESSFUL,
        new CustomerPasswordResetSuccessfulEvent(
          user.id,
          user.email,
          `${user.customerProfile.firstName} ${user.customerProfile.lastName}`,
          userIpAddress,
        ),
      );
    }

    return {
      message: 'Your password has been successfully reset',
    };
  }
}

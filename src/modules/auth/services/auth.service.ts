import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from '../../users/repositories/user.repository';
import * as argon from 'argon2';
import { User } from 'src/modules/users/entities/user.entity';
import { CustomerProfileRepository } from 'src/modules/users/repositories/customer-profile.repository';
import { normalizedEmail } from 'src/common/utils/normalize-email.util';
import { DataSource, EntityManager } from 'typeorm';
import { LoginUserDto } from 'src/modules/users/dto/auth/login-user.dto';
import { JwtTokenService } from './jwt-token.service';
import { RefreshTokenDto } from 'src/modules/users/dto/auth/refresh-token.dto';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RegisterVendorDto } from 'src/modules/users/dto/auth/register-vendor.dto';
import { VendorProfileRepository } from 'src/modules/users/repositories/vendor-profile.repository';
import { VendorProfile } from 'src/modules/users/entities/vendor-profile.entity';
import { RegisterCustomerDto } from 'src/modules/users/dto/auth/register-customer.dto';
import { CustomerProfile } from 'src/modules/users/entities/customer-profile.entity';
import { UserRoleEnum } from 'src/common/enums/user-role.enum';
import { ForgetPasswordDto } from 'src/modules/users/dto/auth/forget-password.dto';
import { ResetPasswordDto } from 'src/modules/users/dto/auth/reset-password.dto';
import { AUTH_EVENTS } from '../events/auth-event-names';
import {
  CustomerForgetPasswordEvent,
  CustomerPasswordResetSuccessfulEvent,
  UserLoggedInEvent,
  UserRegistrationEvent,
  VendorLoggedInEvent,
} from '../events/auth.events';
import { GoogleUser } from '../strategies/google-auth.strategy';
import { UserStatusEnum } from 'src/common/enums/user-status.enum';
import { AuthProviderTypeEnum } from 'src/common/enums/auth-providerType.enum';
import * as crypto from 'crypto';
import { FacebookUser } from '../strategies/facebook-auth.strategy';

interface JwtPayload {
  id: string;
  email: string;
  role: UserRoleEnum;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly customerProfileRepository: CustomerProfileRepository,
    private readonly vendorProfileRepository: VendorProfileRepository,
    private readonly jwtTokenService: JwtTokenService,

    private readonly dataSource: DataSource,
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
  private async buildJwtTokenResponse(user: User, role: UserRoleEnum) {
    const jwtTokenRes = await this.jwtTokenService.jwtSignToken(
      user.id,
      user.email,
      user.role,
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

    this.logger.log(
      `New customer account registered successfully. Id: ${result.id} email: ${result.email}`,
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

    this.logger.log(
      `New vendor account registered successfully. Id: ${result.id} email: ${result.email}`,
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
    } else if (user.role === UserRoleEnum.VENDOR) {
      this.eventEmitter.emit(
        AUTH_EVENTS.VENDOR_LOGGED_IN,
        new VendorLoggedInEvent(
          user.id,
          user.email,
          `${user.vendorProfile.businessName}`,
          userIpAddress,
        ),
      );
    }

    this.logger.log(
      `User logged in successfully. Id: ${user.id}, email: ${user.email}, role: ${user.role}`,
    );
    return await this.buildJwtTokenResponse(user, user.role);
  }

  /**
   * ------ POST - refresh-token
   * Exchanges a valid refresh token for a new access and refresh token pair without requiring re-login.
   * Verifies the JWT signature, confirms the token matches the argon2-hashed value stored on the user,
   * checks the stored expiry date, then re-issues tokens via jwtTokenResponse.
   * @throws UnauthorizedException when the user is not found, the token hash does not match, or the token has expired
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const payload: JwtPayload = this.jwtTokenService.verifyRefreshToken(
      refreshTokenDto.refreshToken,
    );
    const user: User | null = await this.userRepository.findUser(payload.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email. Please try again.');
    }

    const isPasswordVerified: boolean = await argon.verify(
      user.refreshToken,
      refreshTokenDto.refreshToken,
    );
    if (!isPasswordVerified) {
      throw new UnauthorizedException(
        'Invalid or expired refresh-token. Please try again.',
      );
    }

    if (
      user &&
      (!user.refreshTokenExpiryDate ||
        user.refreshTokenExpiryDate < new Date(Date.now()))
    ) {
      throw new UnauthorizedException('Refresh token has expired.');
    }

    return await this.buildJwtTokenResponse(user, user.role);
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
      role: user.role,
    };
    const resetToken: string = await this.jwtTokenService.generateAndSaveToken(
      user.id,
      payload,
      this.configService.get<string>('JWT_PASSWORD_RESET_SECRET_KEY'),
      '7d',
      'resetPasswordToken',
      'resetPasswordTokenExpiryDate',
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );

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

    this.logger.log(
      `Forget password request from user - Id: ${user.id}, email ${user.email}`,
    );
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
    const payload: JwtPayload = this.jwtTokenService.verifyResetToken(
      resetPasswordDto.resetToken,
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

    this.logger.log(
      `Password reset successful from user - Id: ${user.id}, email ${user.email}`,
    );
    return {
      message: 'Your password has been successfully reset',
    };
  }

  /**
   * ------ GET - Google OAuth login / auto-registration
   * Authenticates a user who has completed the Google OAuth consent flow.
   *
   * Flow:
   * 1. Validates the GoogleUser profile forwarded by Passport (email is mandatory).
   * 2. Looks up an existing account by the normalised email address.
   *    - **New user**: opens a database transaction, creates a User record with a random
   *      crypto password (account is not password-loginable), creates a CustomerProfile
   *      from the Google display name and avatar, and emits CUSTOMER_REGISTERED.
   *    - **Existing user**: back-fills `authProviderType` / `authProviderId` if they are
   *      missing, and syncs the Google avatar if the profile has no picture yet.
   * 3. Emits CUSTOMER_LOGGED_IN for audit/notification purposes.
   * 4. Issues and returns a signed JWT access token + refresh token pair via
   *    `buildJwtTokenResponse`.
   *
   * @param googleUser - Normalised profile extracted by `GoogleAuthStrategy.validate`
   * @param ipAddress  - Client IP address captured by the `GetIpAddress` decorator
   * @throws BadRequestException when the Google profile is missing or has no email
   */
  async googleLogin(googleUser: GoogleUser, ipAddress: string) {
    if (!googleUser || !googleUser.email) {
      throw new BadRequestException(
        'Invalid google authentication credentials. Please try again.',
      );
    }

    let user: User | null = await this.userRepository.findUser(
      normalizedEmail(googleUser.email),
    );
    if (!user) {
      user = await this.dataSource.manager.transaction(
        async (manager: EntityManager) => {
          const randomCryptoPassword: string = crypto
            .randomBytes(32)
            .toString('hex');
          const hashedPassword: string = await argon.hash(randomCryptoPassword);

          const customer = manager.create(User, {
            email: normalizedEmail(googleUser.email),
            password: hashedPassword,
            status: UserStatusEnum.ACTIVE,
            role: UserRoleEnum.CUSTOMER,
            authProviderType: AuthProviderTypeEnum.GOOGLE,
            authProviderId: googleUser.providerId,
          });
          const savedCustomer: User | null =
            await this.userRepository.save(customer);

          const fullGoogleUserName: string[] = googleUser.name
            .trim()
            .split(' ');
          const firstName: string = fullGoogleUserName[0];
          const lastName: string = fullGoogleUserName.slice(1).join('');

          const customerProfile = this.customerProfileRepository.create({
            firstName: firstName,
            lastName: lastName,
            profileUrl: googleUser.avatar,
            userId: savedCustomer.id,
          });
          const savedCustomerProfile: CustomerProfile =
            await this.customerProfileRepository.save(customerProfile);
          savedCustomer.customerProfile = savedCustomerProfile;

          return savedCustomer;
        },
      );

      this.eventEmitter.emit(
        AUTH_EVENTS.CUSTOMER_REGISTERED,
        new UserRegistrationEvent(
          user.id,
          user.email,
          `${user.customerProfile.firstName} ${user.customerProfile.lastName}`,
          ipAddress,
        ),
      );
    } else {
      let isUpdated: boolean = false;
      if (
        user.authProviderType !== AuthProviderTypeEnum.GOOGLE ||
        !user.authProviderId
      ) {
        user.authProviderType = AuthProviderTypeEnum.GOOGLE;
        user.authProviderId = googleUser.providerId;
        isUpdated = true;
      }

      if (
        googleUser.avatar &&
        user.customerProfile &&
        !user.customerProfile.profileUrl
      ) {
        user.customerProfile.profileUrl = googleUser.avatar;
        await this.customerProfileRepository.save(user.customerProfile);
      }

      if (isUpdated) {
        await this.userRepository.save(user);
      }
    }

    this.eventEmitter.emit(
      AUTH_EVENTS.CUSTOMER_LOGGED_IN,
      new UserLoggedInEvent(
        user.id,
        user.email,
        `${user.customerProfile.firstName} ${user.customerProfile.lastName}`,
        ipAddress,
      ),
    );

    return this.buildJwtTokenResponse(user, user.role);
  }

  /**
   * ------ GET - Facebook OAuth login / auto-registration
   * Authenticates a user who has completed the Facebook OAuth login flow.
   *
   */
  async facebookLogin(facebookUser: FacebookUser, ipAddress: string) {
    if (!facebookUser || !facebookUser.email) {
      throw new BadRequestException('Invalid Facebook user profile.');
    }

    const email = normalizedEmail(facebookUser.email);

    let user = await this.userRepository.findUser(email);

    if (!user) {
      user = await this.dataSource.manager.transaction(
        async (manager: EntityManager) => {
          const existingUser = await manager.findOne(User, {
            where: { email },
            relations: ['userProfile'],
          });
          if (existingUser) {
            return existingUser;
          }

          const randomPassword = crypto.randomBytes(32).toString('hex');
          const hashedPassword = await argon.hash(randomPassword);

          const newUser = manager.create(User, {
            email,
            password: hashedPassword,
            authProviderType: AuthProviderTypeEnum.FACEBOOK,
            authProviderId: facebookUser.providerId,
            userStatus: UserStatusEnum.ACTIVE,
          });
          const savedUser = await manager.save(User, newUser);

          const fullFacebookUser: string[] = facebookUser.name
            .trim()
            .split(' ');
          const firstName: string = fullFacebookUser[0];
          const lastName: string = fullFacebookUser.slice(1).join('');

          const userProfile = manager.create(CustomerProfile, {
            firstName,
            lastName,
            profileUrl: facebookUser.avatar || undefined,
            userId: savedUser.id,
          });
          await manager.save(CustomerProfile, userProfile);

          savedUser.customerProfile = userProfile;
          return savedUser;
        },
      );

      this.eventEmitter.emit(
        AUTH_EVENTS.CUSTOMER_REGISTERED,
        new UserRegistrationEvent(
          user.id,
          user.email,
          `${user.customerProfile.firstName} ${user.customerProfile.lastName}`,
          ipAddress,
        ),
      );
    } else {
      let updated = false;
      if (user.authProviderType !== AuthProviderTypeEnum.FACEBOOK) {
        user.authProviderType = AuthProviderTypeEnum.FACEBOOK;
        user.authProviderId = facebookUser.providerId;
        updated = true;
      } else if (!user.authProviderId) {
        user.authProviderId = facebookUser.providerId;
        updated = true;
      }

      if (
        facebookUser.avatar &&
        user.customerProfile &&
        !user.customerProfile.profileUrl
      ) {
        user.customerProfile.profileUrl = facebookUser.avatar;
        await this.customerProfileRepository.save(user.customerProfile);
      }

      if (updated) {
        await this.userRepository.save(user);
      }
    }

    const fullName = user.customerProfile
      ? `${user.customerProfile.firstName} ${user.customerProfile.lastName}`
      : 'Facebook User';

    this.eventEmitter.emit(
      AUTH_EVENTS.CUSTOMER_LOGGED_IN,
      new UserLoggedInEvent(user.id, user.email, fullName, ipAddress),
    );

    return this.buildJwtTokenResponse(user, user.role);
  }
}

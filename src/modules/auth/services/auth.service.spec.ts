import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, EntityManager } from 'typeorm';
import * as argon from 'argon2';
import { AuthService } from './auth.service';
import { UserRepository } from '../../users/repositories/user.repository';
import { CustomerProfileRepository } from '../../users/repositories/customer-profile.repository';
import { VendorProfileRepository } from '../../users/repositories/vendor-profile.repository';
import { JwtTokenService } from './jwt-token.service';
import { User } from 'src/modules/users/entities/user.entity';
import { UserRoleEnum } from 'src/common/enums/user-role.enum';
import { AUTH_EVENTS } from 'src/mail/events/auth-event-names';
import {
  CustomerForgetPasswordEvent,
  CustomerPasswordResetSuccessfulEvent,
  UserLoggedInEvent,
  UserRegistrationEvent,
} from 'src/mail/events/auth.events';
import { RegisterCustomerDto } from 'src/modules/users/dto/register-customer.dto';
import { RegisterVendorDto } from 'src/modules/users/dto/register-vendor.dto';

jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;

  const userRepository = {
    findUser: jest.fn(),
    registerUser: jest.fn(),
    save: jest.fn(),
  };

  const customerProfileRepository = {
    createUserProfile: jest.fn(),
  };

  const vendorProfileRepository = {
    createVendorProfile: jest.fn(),
  };

  const jwtTokenService = {
    jwtSignToken: jest.fn(),
  };

  const dataSource = {
    transaction: jest.fn(),
  };

  const jwtService = {
    verify: jest.fn(),
    sign: jest.fn(),
  };

  const configService = {
    get: jest.fn(),
  };

  const eventEmitter = {
    emit: jest.fn(),
  };

  const registerCustomerDto: RegisterCustomerDto = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'John.Doe@Example.com',
    password: 'Password@123',
    confirmPassword: 'Password@123',
    status: 'active',
    phoneNumber: '+9779812345678',
  };

  const registerVendorDto: RegisterVendorDto = {
    businessName: 'Acme Corp',
    email: 'vendor@example.com',
    password: 'Password@123',
    confirmPassword: 'Password@123',
    status: 'active',
    phoneNumber: '+9779812345678',
  };

  const customerUser: User = {
    id: 'user-id',
    email: 'john.doe@example.com',
    password: 'hashed-password',
    role: UserRoleEnum.CUSTOMER,
    customerProfile: {
      id: 'profile-id',
      firstName: 'John',
      lastName: 'Doe',
      profileUrl: 'https://example.com/profile.jpg',
      phoneNumber: '+9779812345678',
    },
  } as User;

  const userIpAddress = '127.0.0.1';

  const vendorUser: User = {
    id: 'vendor-id',
    email: 'vendor@example.com',
    password: 'hashed-password',
    role: UserRoleEnum.VENDOR,
    vendorProfile: {
      id: 'vendor-profile-id',
      businessName: 'Acme Corp',
      businessProfileUrl: 'https://example.com/business.jpg',
      phoneNumber: '+9779812345678',
    },
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: userRepository },
        {
          provide: CustomerProfileRepository,
          useValue: customerProfileRepository,
        },
        { provide: VendorProfileRepository, useValue: vendorProfileRepository },
        { provide: JwtTokenService, useValue: jwtTokenService },
        { provide: DataSource, useValue: dataSource },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    dataSource.transaction.mockImplementation(async (cb) =>
      cb({} as EntityManager),
    );
    configService.get.mockImplementation((key: string) => {
      const secrets: Record<string, string> = {
        JWT_REFRESH_SECRET_KEY: 'refresh-secret',
        JWT_PASSWORD_RESET_SECRET_KEY: 'reset-secret',
      };
      return secrets[key];
    });
    (argon.hash as jest.Mock).mockResolvedValue('hashed-value');
    (argon.verify as jest.Mock).mockResolvedValue(true);
    jwtTokenService.jwtSignToken.mockResolvedValue({
      message: 'User logged in successfully.',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    jest.clearAllMocks();
  });

  describe('registerCustomer', () => {
    it('should register a customer and emit CUSTOMER_REGISTERED when credentials are valid', async () => {
      userRepository.findUser.mockResolvedValue(null);
      userRepository.registerUser.mockResolvedValue({
        id: 'user-id',
        email: 'john.doe@example.com',
        role: UserRoleEnum.CUSTOMER,
      });
      customerProfileRepository.createUserProfile.mockResolvedValue({
        id: 'profile-id',
        firstName: 'John',
        lastName: 'Doe',
        profileUrl: null,
        phoneNumber: '+9779812345678',
      });

      const result = await service.registerCustomer(
        registerCustomerDto,
        userIpAddress,
      );

      expect(result).toEqual({
        message: 'User registered successfully.',
        id: 'user-id',
        email: 'john.doe@example.com',
        role: UserRoleEnum.CUSTOMER,
        customerProfile: {
          id: 'profile-id',
          firstName: 'John',
          lastName: 'Doe',
          profileUrl: null,
          phoneNumber: '+9779812345678',
        },
      });
      expect(userRepository.registerUser).toHaveBeenCalledWith(
        'john.doe@example.com',
        'hashed-value',
        expect.any(Object),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        AUTH_EVENTS.CUSTOMER_REGISTERED,
        expect.any(UserRegistrationEvent),
      );
    });

    it('should throw BadRequestException when passwords do not match', async () => {
      const dto = { ...registerCustomerDto, confirmPassword: 'Mismatch@123' };

      await expect(
        service.registerCustomer(dto, userIpAddress),
      ).rejects.toThrow(
        new BadRequestException('Passwords does not match. Please try again.'),
      );
      expect(userRepository.registerUser).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      userRepository.findUser.mockResolvedValue(customerUser);

      await expect(
        service.registerCustomer(registerCustomerDto, userIpAddress),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.registerCustomer(registerCustomerDto, userIpAddress),
      ).rejects.toThrow('User with this email already exists.');
    });
  });

  describe('registerVendor', () => {
    it('should register a vendor and emit VENDOR_REGISTERED when credentials are valid', async () => {
      userRepository.findUser.mockResolvedValue(null);
      userRepository.registerUser.mockResolvedValue({
        id: 'vendor-id',
        email: 'vendor@example.com',
        role: UserRoleEnum.VENDOR,
      });
      vendorProfileRepository.createVendorProfile.mockResolvedValue({
        id: 'vendor-profile-id',
        businessName: 'Acme Corp',
        businessProfileUrl: 'https://example.com/business.jpg',
        phoneNumber: '+9779812345678',
      });

      const result = await service.registerVendor(
        registerVendorDto,
        userIpAddress,
      );

      expect(result).toEqual({
        message:
          'Vendor business account registered successfully. Please wait for your approval.',
        id: 'vendor-id',
        email: 'vendor@example.com',
        role: UserRoleEnum.VENDOR,
        vendorProfile: {
          id: 'vendor-profile-id',
          businessName: 'Acme Corp',
          businessProfileUrl: 'https://example.com/business.jpg',
          phoneNumber: '+9779812345678',
        },
      });
      expect(userRepository.registerUser).toHaveBeenCalledWith(
        'vendor@example.com',
        'hashed-value',
        expect.any(Object),
        UserRoleEnum.VENDOR,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        AUTH_EVENTS.VENDOR_REGISTERED,
        expect.any(UserRegistrationEvent),
      );
    });

    it('should throw BadRequestException when passwords do not match', async () => {
      const dto = { ...registerVendorDto, confirmPassword: 'Mismatch@123' };

      await expect(
        service.registerVendor(dto, userIpAddress),
      ).rejects.toThrow(
        new BadRequestException('Passwords does not match. Please try again.'),
      );
      expect(userRepository.registerUser).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      userRepository.findUser.mockResolvedValue(vendorUser);

      await expect(
        service.registerVendor(registerVendorDto, userIpAddress),
      ).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('loginUser', () => {
    it('should return tokens and customer profile when credentials are valid', async () => {
      userRepository.findUser.mockResolvedValue(customerUser);

      const result = await service.loginUser(
        {
          email: 'john.doe@example.com',
          password: 'Password@123',
        },
        userIpAddress,
      );

      expect(result).toEqual({
        message: 'User logged in successfully.',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-id',
          email: 'john.doe@example.com',
          role: UserRoleEnum.CUSTOMER,
          profile: {
            id: 'profile-id',
            firstName: 'John',
            lastName: 'Doe',
            profileUrl: 'https://example.com/profile.jpg',
            phoneNumber: '+9779812345678',
          },
        },
      });
      expect(argon.verify).toHaveBeenCalledWith(
        'hashed-password',
        'Password@123',
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        AUTH_EVENTS.CUSTOMER_LOGGED_IN,
        expect.any(UserLoggedInEvent),
      );
    });

    it('should return tokens and vendor profile when vendor credentials are valid', async () => {
      userRepository.findUser.mockResolvedValue(vendorUser);

      const result = await service.loginUser(
        {
          email: 'vendor@example.com',
          password: 'Password@123',
        },
        userIpAddress,
      );

      expect(result.user.profile).toEqual({
        id: 'vendor-profile-id',
        businessName: 'Acme Corp',
        profileUrl: 'https://example.com/business.jpg',
        phoneNumber: '+9779812345678',
      });
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      userRepository.findUser.mockResolvedValue(null);

      await expect(
        service.loginUser(
          {
            email: 'missing@example.com',
            password: 'Password@123',
          },
          userIpAddress,
        ),
      ).rejects.toThrow('Invalid email or password.');
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      userRepository.findUser.mockResolvedValue(customerUser);
      (argon.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.loginUser(
          {
            email: 'john.doe@example.com',
            password: 'WrongPassword@123',
          },
          userIpAddress,
        ),
      ).rejects.toThrow('Invalid email or password.');
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto = { refreshToken: 'valid-refresh-token' };

    const userWithRefreshToken: User = {
      ...customerUser,
      refreshToken: 'hashed-refresh-token',
      refreshTokenExpiryDate: new Date(Date.now() + 60_000),
    };

    beforeEach(() => {
      jwtService.verify.mockReturnValue({
        id: 'user-id',
        email: 'john.doe@example.com',
      });
    });

    it('should return new tokens when refresh token is valid', async () => {
      userRepository.findUser.mockResolvedValue(userWithRefreshToken);

      const result = await service.refreshToken(refreshTokenDto);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'refresh-secret',
      });
      expect(argon.verify).toHaveBeenCalledWith(
        'hashed-refresh-token',
        'valid-refresh-token',
      );
      expect(result.accessToken).toBe('access-token');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      userRepository.findUser.mockResolvedValue(null);

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        'Invalid email. Please try again.',
      );
    });

    it('should throw UnauthorizedException when refresh token hash does not match', async () => {
      userRepository.findUser.mockResolvedValue(userWithRefreshToken);
      (argon.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        'Invalid password. Please try again.',
      );
    });

    it('should throw UnauthorizedException when refresh token has expired', async () => {
      userRepository.findUser.mockResolvedValue({
        ...userWithRefreshToken,
        refreshTokenExpiryDate: new Date(Date.now() - 60_000),
      });

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        'Refresh token has expired.',
      );
    });
  });

  describe('forgetPassword', () => {
    it('should generate reset token, save user, and emit CUSTOMER_FORGET_PASSWORD when email exists', async () => {
      userRepository.findUser.mockResolvedValue(customerUser);
      jwtService.sign.mockReturnValue('reset-token');
      userRepository.save.mockResolvedValue(customerUser);

      const result = await service.forgetPassword(
        { email: 'john.doe@example.com' },
        userIpAddress,
      );

      expect(result).toEqual({
        message: 'Password reset link has been sent to your email.',
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { id: 'user-id', email: 'john.doe@example.com' },
        { secret: 'reset-secret', expiresIn: '15m' },
      );
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          resetPasswordToken: 'hashed-value',
          resetPasswordTokenExpiryDate: expect.any(Date),
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        AUTH_EVENTS.CUSTOMER_FORGET_PASSWORD,
        expect.any(CustomerForgetPasswordEvent),
      );
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when email is not found', async () => {
      userRepository.findUser.mockResolvedValue(null);

      await expect(
        service.forgetPassword(
          { email: 'missing@example.com' },
          userIpAddress,
        ),
      ).rejects.toThrow('Invalid email. Please try again.');
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto = {
      resetToken: 'valid-reset-token',
      newPassword: 'NewPassword@123',
    };

    const userWithResetToken: User = {
      ...customerUser,
      resetPasswordToken: 'hashed-reset-token',
      resetPasswordTokenExpiryDate: new Date(Date.now() + 60_000),
    };

    beforeEach(() => {
      jwtService.verify.mockReturnValue({
        id: 'user-id',
        email: 'john.doe@example.com',
      });
    });

    it('should update password, clear reset fields, and emit CUSTOMER_PASSWORD_RESET_SUCCESSFUL when token is valid', async () => {
      userRepository.findUser.mockResolvedValue(userWithResetToken);
      userRepository.save.mockResolvedValue(userWithResetToken);

      const result = await service.resetPassword(
        resetPasswordDto,
        userIpAddress,
      );

      expect(result).toEqual({
        message: 'Your password has been successfully reset',
      });
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashed-value',
          resetPasswordToken: null,
          resetPasswordTokenExpiryDate: null,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        AUTH_EVENTS.CUSTOMER_PASSWORD_RESET_SUCCESSFUL,
        expect.any(CustomerPasswordResetSuccessfulEvent),
      );
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      userRepository.findUser.mockResolvedValue(null);

      await expect(
        service.resetPassword(resetPasswordDto, userIpAddress),
      ).rejects.toThrow('Invalid email. Please try again.');
    });

    it('should throw UnauthorizedException when reset token has expired', async () => {
      userRepository.findUser.mockResolvedValue({
        ...userWithResetToken,
        resetPasswordToken: 'hashed-reset-token',
        resetPasswordTokenExpiryDate: new Date(Date.now() - 60_000),
      });

      await expect(
        service.resetPassword(resetPasswordDto, userIpAddress),
      ).rejects.toThrow('The reset token has expired. Please try again.');
    });
  });
});

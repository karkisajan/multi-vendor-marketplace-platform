import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { CustomerProfileRepository } from '../repositories/customer-profile.repository';
import { VendorProfileRepository } from '../repositories/vendor-profile.repository';
import { CurrentUserContext } from '../types/user.types';
import { User } from '../entities/user.entity';
import { UserRoleEnum } from 'src/common/enums/user-role.enum';
import { UpdateCustomerDto } from '../dto/user/update-customer.dto';
import { UpdateVendorDto } from '../dto/user/update.-vendor.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'node_modules/cache-manager/dist/index.cjs';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly customerProfileRepository: CustomerProfileRepository,
    private readonly vendorProfileRepository: VendorProfileRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * Retrieve the authenticated user's full profile details.
   *
   * Fetches the user record by email and returns a role-aware
   * profile shape — customer fields for CUSTOMER users, business
   * fields for VENDOR users.
   */
  async getUserDetails(user: CurrentUserContext) {
    const cacheKey = `user:${user.id}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) return cachedData;

    const userInformation: User | null = await this.userRepository.findUser(
      user.email,
    );
    if (!userInformation) {
      throw new UnauthorizedException(
        'Invalid user or user does not exists. Please login again to continue.',
      );
    }

    const result = {
      id: userInformation.id,
      email: userInformation.email,
      profile:
        user.role === UserRoleEnum.CUSTOMER
          ? {
              id: userInformation.customerProfile.id,
              firstName: userInformation.customerProfile.firstName,
              lastName: userInformation.customerProfile.lastName,
              profileUrl: userInformation.customerProfile.profileUrl,
              phoneNumber: userInformation.customerProfile.phoneNumber,
            }
          : {
              id: userInformation.vendorProfile.id,
              businessName: userInformation.vendorProfile.businessName,
              profileUrl: userInformation.vendorProfile.businessProfileUrl,
              phoneNumber: userInformation.vendorProfile.phoneNumber,
            },
    };

    await this.cacheManager.set(cacheKey, result, 60 * 1000);
    return result;
  }

  /**
   * Update the authenticated user's profile.
   *
   * Delegates to the appropriate profile repository based on the
   * user's role so that customers and vendors each update only the
   * fields relevant to their profile type.
   *
   */
  async updateUserProfile(
    user: CurrentUserContext,
    updateDto: UpdateCustomerDto | UpdateVendorDto,
  ) {
    const existingUser = await this.userRepository.findUserById(user.id);
    if (!existingUser) {
      throw new NotFoundException(
        'User not found. The account may have been deleted.',
      );
    }

    if (user.role === UserRoleEnum.CUSTOMER) {
      await this.customerProfileRepository.updateCustomerProfile(
        user.id,
        updateDto,
      );
    } else {
      await this.vendorProfileRepository.updateVendorProfile(
        user.id,
        updateDto,
      );
    }

    await this.cacheManager.del(`user:${user.id}`);
    return await this.getUserDetails(user);
  }

  /**
   * Soft-delete the authenticated user's account.
   *
   * Uses TypeORM's soft-delete mechanism which sets the `deletedAt`
   * timestamp rather than physically removing the row.  This preserves
   * order history, audit logs, and allows potential account recovery.
   *
   */
  async deleteUser(user: CurrentUserContext) {
    const existingUser = await this.userRepository.findUserById(user.id);
    if (!existingUser) {
      throw new NotFoundException(
        'User not found. The account may have already been deleted.',
      );
    }

    await this.userRepository.softDeleteUser(user.id);
    await this.cacheManager.del(`user:${user.id}`);
    return {
      message: 'Your account has been successfully deleted.',
    };
  }
}

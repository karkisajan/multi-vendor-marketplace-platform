import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CustomerProfile } from '../entities/customer-profile.entity';
import { RegisterCustomerDto } from '../dto/auth/register-customer.dto';
import { UpdateCustomerDto } from '../dto/user/update-customer.dto';

@Injectable()
export class CustomerProfileRepository extends Repository<CustomerProfile> {
  constructor(dataSource: DataSource) {
    super(CustomerProfile, dataSource.createEntityManager());
  }

  /* POST - user profile */
  async createUserProfile(
    registerUserDto: RegisterCustomerDto,
    userId: string,
    manager: EntityManager,
  ) {
    const userProfile = manager.create(CustomerProfile, {
      firstName: registerUserDto.firstName,
      lastName: registerUserDto.lastName,
      phoneNumber: registerUserDto.phoneNumber,
      userId: userId,
    });

    return await manager.save(CustomerProfile, userProfile);
  }

  /* PUT - update customer profile */
  async updateCustomerProfile(
    userId: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<void> {
    await this.update({ userId }, updateCustomerDto);
  }
}

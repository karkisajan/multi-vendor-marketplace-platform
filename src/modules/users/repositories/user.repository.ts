import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserStatusEnum } from 'src/common/enums/user-status.enum';
import { AuthProviderTypeEnum } from 'src/common/enums/auth-providerType.enum';
import { UserRoleEnum } from 'src/common/enums/user-role.enum';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  /* POST - register user */
  async registerUser(
    normalizedEmail: string,
    hashedPassword: string,
    manager: EntityManager,
    role: UserRoleEnum = UserRoleEnum.CUSTOMER,
  ) {
    const user = manager.create(User, {
      email: normalizedEmail,
      password: hashedPassword,
      status: UserStatusEnum.ACTIVE,
      authProviderType: AuthProviderTypeEnum.EMAIL,
      role: role,
    });

    return await manager.save(User, user);
  }

  /* GET - user by email */
  async findUser(email: string): Promise<User | null> {
    return await this.findOne({
      where: {
        email: email,
      },
      relations: ['customerProfile', 'vendorProfile'],
    });
  }

  /* GET - find user */
  async findUserById(userId: string): Promise<User | null> {
    return await this.findOne({
      where: { id: userId },
      relations: ['customerProfile', 'vendorProfile'],
    });
  }

  /* DELETE - user */
  async softDeleteUser(userId: string): Promise<void> {
    await this.softDelete(userId);
  }
}

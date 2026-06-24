import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserRepository } from './repositories/user.repository';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { CustomerProfile } from './entities/customer-profile.entity';
import { VendorProfile } from './entities/vendor-profile.entity';
import { CustomerProfileRepository } from './repositories/customer-profile.repository';
import { VendorProfileRepository } from './repositories/vendor-profile.repository';

/**
 * UsersModule
 *
 * Bundles all user-related concerns — entities, repositories,
 * services, and controllers — into a single cohesive module.
 * Both customer and vendor profile repositories are registered
 * so the service layer can update/delete either profile type.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, CustomerProfile, VendorProfile])],
  controllers: [UserController],
  providers: [
    UserRepository,
    CustomerProfileRepository,
    VendorProfileRepository,
    UserService,
  ],
  exports: [
    UserRepository,
    CustomerProfileRepository,
    VendorProfileRepository,
    UserService,
  ],
})
export class UsersModule {}

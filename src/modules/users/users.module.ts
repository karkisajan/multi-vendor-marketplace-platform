import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserRepository } from './repositories/user.repository';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { CustomerProfile } from './entities/customer-profile.entity';
import { VendorProfile } from './entities/vendor-profile.entity';
import { CustomerProfileRepository } from './repositories/customer-profile.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, CustomerProfile, VendorProfile])],
  controllers: [UserController],
  providers: [UserRepository, CustomerProfileRepository, UserService],
  exports: [UserRepository, CustomerProfileRepository, UserService],
})
export class UsersModule {}

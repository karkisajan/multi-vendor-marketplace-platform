import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { UserRepository } from '../users/repositories/user.repository';
import { CustomerProfileRepository } from '../users/repositories/customer-profile.repository';
import { JwtTokenService } from './services/jwt-token.service';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from 'src/mail/mail.module';
import { MailService } from 'src/mail/mail.service';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { VendorProfile } from '../users/entities/vendor-profile.entity';
import { VendorProfileRepository } from '../users/repositories/vendor-profile.repository';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, CustomerProfile, VendorProfile]),
    JwtModule.register({ signOptions: { expiresIn: '7d' } }),
    MailModule,
    AuditLogsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    CustomerProfileRepository,
    VendorProfileRepository,
    JwtTokenService,
    MailService,
  ],
})
export class AuthModule {}

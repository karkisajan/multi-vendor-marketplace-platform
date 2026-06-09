import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CustomerProfile } from './customer-profile.entity';
import { AuthProviderTypeEnum } from 'src/common/enums/auth-providerType.enum';
import { UserStatusEnum } from 'src/common/enums/user-status.enum';
import { UserRoleEnum } from 'src/common/enums/user-role.enum';
import { VendorProfile } from './vendor-profile.entity';
import { AuditLog } from 'src/modules/audit-logs/entities/audit-logs.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, unique: true })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false, type: 'enum', enum: UserStatusEnum })
  status: UserStatusEnum;

  @Column({
    nullable: false,
    type: 'enum',
    enum: UserRoleEnum,
    default: UserRoleEnum.CUSTOMER,
  })
  role: UserRoleEnum;

  @Column({ nullable: false, type: 'enum', enum: AuthProviderTypeEnum })
  authProviderType: AuthProviderTypeEnum;

  @Column({ nullable: true })
  authProviderId: string;

  @Column({ nullable: true, type: 'text' })
  refreshToken: string;

  @Column({ nullable: true, type: 'timestamptz' })
  refreshTokenExpiryDate: Date;

  @Column({ nullable: true, type: 'text' })
  resetPasswordToken: string | null;

  @Column({ nullable: true, type: 'timestamptz' })
  resetPasswordTokenExpiryDate: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  /* One to one relation (user should have a profile) */
  @OneToOne(() => CustomerProfile, (customerProfile) => customerProfile.user, {
    cascade: true,
  })
  customerProfile: CustomerProfile;

  /* One to one relation (vendor should have a profile) */
  @OneToOne(() => VendorProfile, (vendorProfile) => vendorProfile.user, {
    cascade: true,
  })
  vendorProfile: VendorProfile;

  /* One to many relation (user to audit logs) can have multiple audit logs */
  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditLogs: AuditLog[];
}

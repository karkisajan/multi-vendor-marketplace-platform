import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { VendorStatusEnum } from 'src/common/enums/vendor-status.enum';

@Entity({ name: 'vendor_profiles' })
export class VendorProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ nullable: false, type: 'text' })
  businessName: string;

  @Column({ nullable: true })
  businessProfileUrl: string;

  @Column({
    type: 'enum',
    enum: VendorStatusEnum,
    default: VendorStatusEnum.PENDING,
  })
  vendorStatus: VendorStatusEnum;

  @Column({ nullable: true, type: 'text' })
  rejectionReason: string;

  @Column({ nullable: true, type: 'timestamptz' })
  approvedAt: Date;

  @Column({ nullable: true })
  phoneNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.vendorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

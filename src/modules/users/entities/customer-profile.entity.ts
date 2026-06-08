import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'customer_profiles' })
export class CustomerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  firstName: string;

  @Column({ nullable: false })
  lastName: string;

  @Column({ nullable: true })
  profileUrl: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: false, type: 'uuid', name: 'user_id' })
  userId: string;

  @OneToOne(() => User, (user) => user.customerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

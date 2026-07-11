import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CustomerProfile } from 'src/modules/users/entities/customer-profile.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { VendorProfile } from 'src/modules/users/entities/vendor-profile.entity';
import { BookmarkTypeEnum } from 'src/common/enums/bookmark-type.enum';

@Entity({ name: 'bookmarks' })
export class Bookmark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid', name: 'customer_id' })
  customerId: string;

  @Column({ nullable: true, type: 'uuid', name: 'product_id' })
  productId: string | null;

  @Column({ nullable: true, type: 'uuid', name: 'vendor_profile_id' })
  vendorProfileId: string | null;

  @Column({
    type: 'enum',
    enum: BookmarkTypeEnum,
  })
  bookmarkType: BookmarkTypeEnum;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product | null;

  @ManyToOne(() => CustomerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerProfile;

  @ManyToOne(() => VendorProfile, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_profile_id' })
  vendorProfile: VendorProfile | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

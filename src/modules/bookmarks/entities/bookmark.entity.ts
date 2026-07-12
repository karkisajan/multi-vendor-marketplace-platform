import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from 'src/modules/products/entities/product.entity';
import { BookmarkTypeEnum } from 'src/common/enums/bookmark-type.enum';
import { User } from 'src/modules/users/entities/user.entity';

@Entity({ name: 'bookmarks' })
export class Bookmark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'uuid', name: 'customer_id' })
  customerId: string;

  @Column({ nullable: true, type: 'uuid', name: 'vendor_id' })
  vendorId: string | null;

  @Column({ nullable: true, type: 'uuid', name: 'product_id' })
  productId: string | null;

  @Column({
    type: 'enum',
    enum: BookmarkTypeEnum,
  })
  bookmarkType: BookmarkTypeEnum;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

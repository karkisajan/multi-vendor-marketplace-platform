import { Category } from 'src/modules/categories/entities/category.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { ProductStatusEnum } from 'src/common/enums/product-status.enum';
import { Bookmark } from 'src/modules/bookmarks/entities/bookmark.entity';
import { ProductSpecification } from './product-specification.entity';
import { ProductRating } from './product-rating.entity';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, name: 'vendor_id', type: 'uuid' })
  vendorId: string;

  @Column({ nullable: true, name: 'category_id', type: 'uuid' })
  categoryId: string;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  name: string;

  @Column({ nullable: true })
  slug: string;

  @Column({ nullable: true, type: 'varchar', length: 300 })
  description: string;

  @Column({
    type: 'enum',
    enum: ProductStatusEnum,
    default: ProductStatusEnum.DRAFT,
  })
  status: ProductStatusEnum;

  @Column({ nullable: true, name: 'flag_reason', type: 'varchar', length: 500 })
  flagReason: string;

  @Column({ nullable: true, type: 'uuid', name: 'flagged_by' })
  flaggedBy: string;

  @ManyToOne(() => User, (user) => user.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  user: User;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => ProductVariant, (productVariant) => productVariant.product, {
    cascade: true,
  })
  productVariants: ProductVariant[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.product)
  bookmarks: Bookmark[];

  @OneToMany(
    () => ProductSpecification,
    (productSpecification) => productSpecification.product,
    { cascade: true },
  )
  productSpecifications: ProductSpecification[];

  @OneToMany(() => ProductRating, (productRating) => productRating.product)
  productRatings: ProductRating[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

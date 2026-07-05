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
import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';
import { VariantStatusEnum } from 'src/common/enums/product-status.enum';

@Entity({ name: 'product_variants' })
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  sellingPrice: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  crossPrice: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  costPrice: number;

  @Column({ nullable: true, type: 'int' })
  stockQuantity: number;

  @Column({ nullable: true, type: 'enum', enum: VariantStatusEnum })
  status: VariantStatusEnum;

  @Column({ nullable: true, type: 'jsonb' })
  variantAttributes: Record<string, any>;

  @Column({ nullable: true, default: false })
  isDefault: boolean;

  @ManyToOne(() => Product, (product) => product.productVariants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @OneToMany(
    () => ProductImage,
    (productImage) => productImage.productVariant,
    { cascade: true },
  )
  productImages: ProductImage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

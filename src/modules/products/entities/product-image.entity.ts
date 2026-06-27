import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';

@Entity({ name: 'product_images' })
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  publicId: string;

  @Column({ nullable: true, name: 'variant_id', type: 'uuid' })
  variantId: string;

  @Column({ nullable: true, default: false })
  isPrimary: boolean;

  @Column({ nullable: true, type: 'text' })
  imageUrl: string;

  @ManyToOne(
    () => ProductVariant,
    (productVariant) => productVariant.productImages,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'variant_id' })
  productVariant: ProductVariant;
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductSpecification } from './entities/product-specification.entity';
import { ProductRepository } from './repositories/product.repository';
import { ProductVariantRepository } from './repositories/product-variant.repository';
import { ProductImageRepository } from './repositories/product-image.repository';
import { ProductSpecificationRepository } from './repositories/product-specification.repository';
import { VendorProductService } from './services/vendor-product.service';
import { AdminProductService } from './services/admin-product.service';
import { VendorProductController } from './controllers/vendor-product.controller';
import { AdminProductController } from './controllers/admin-product.controller';
import { CategoryRepository } from '../categories/repositories/category.repository';
import { CustomerProductController } from './controllers/customer-product.controller';
import { CustomerProductService } from './services/customer-product.service';
import { ProductRatingRepository } from './repositories/product-rating.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductVariant,
      ProductImage,
      ProductSpecification,
    ]),
  ],
  controllers: [
    VendorProductController,
    AdminProductController,
    CustomerProductController,
  ],
  providers: [
    VendorProductService,
    AdminProductService,
    CustomerProductService,
    ProductRepository,
    ProductVariantRepository,
    ProductImageRepository,
    ProductSpecificationRepository,
    ProductRatingRepository,
    CategoryRepository,
  ],
  exports: [
    VendorProductService,
    AdminProductService,
    CustomerProductService,
    ProductRepository,
    ProductVariantRepository,
    ProductImageRepository,
    ProductSpecificationRepository,
  ],
})
export class ProductsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductRepository } from './repositories/product.repository';
import { ProductVariantRepository } from './repositories/product-variant.repository';
import { ProductImageRepository } from './repositories/product-image.repository';
import { ProductService } from './services/product.service';
import { VendorProductController } from './controllers/vendor-product.controller';
import { AdminProductController } from './controllers/admin-product.controller';
import { CategoryRepository } from '../categories/repositories/category.repository';
import { CustomerProductController } from './controllers/customer-product.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductVariant, ProductImage])],
  controllers: [
    VendorProductController,
    AdminProductController,
    CustomerProductController,
  ],
  providers: [
    ProductService,
    ProductRepository,
    ProductVariantRepository,
    ProductImageRepository,
    CategoryRepository,
  ],
  exports: [
    ProductService,
    ProductRepository,
    ProductVariantRepository,
    ProductImageRepository,
  ],
})
export class ProductsModule {}

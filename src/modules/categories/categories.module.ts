import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminCategoryController } from './controllers/admin-category.controller';
import { CustomerCategoryController } from './controllers/customer-category.controller';
import { VendorCategoryController } from './controllers/vendor-category.controller';
import { CategoryRepository } from './repositories/category.repository';
import { Category } from './entities/category.entity';
import { ProductRepository } from '../products/repositories/product.repository';
import { CategoryHelperService } from './services/category-helper.service';
import { CustomerCategoryService } from './services/customer-category.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [
    AdminCategoryController,
    CustomerCategoryController,
    VendorCategoryController,
  ],
  providers: [
    CustomerCategoryService,
    CategoryRepository,
    CategoryHelperService,
    ProductRepository,
  ],
  exports: [CategoryRepository],
})
export class CategoriesModule { }

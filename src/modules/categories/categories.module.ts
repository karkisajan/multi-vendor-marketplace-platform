import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminCategoryController } from './controllers/admin-category.controller';
import { CustomerCategoryController } from './controllers/customer-category.controller';
import { VendorCategoryController } from './controllers/vendor-category.controller';
import { CategoryService } from './services/category.service';
import { CategoryRepository } from './repositories/category.repository';
import { Category } from './entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [
    AdminCategoryController,
    CustomerCategoryController,
    VendorCategoryController,
  ],
  providers: [CategoryService, CategoryRepository],
  exports: [CategoryService, CategoryRepository],
})
export class CategoriesModule {}

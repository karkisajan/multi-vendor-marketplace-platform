import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetAllParentCategories,
  ApiGetCategoryTree,
} from '../decorators/category-swagger.decorator';
import { CustomerCategoryService } from '../services/customer-category.service';

@ApiTags('Customer Categories')
@Controller('/categories')
export class CustomerCategoryController {
  constructor(private readonly categoryService: CustomerCategoryService) {}

  /**
   * ------ GET - Get all parent categories
   * Retrieves a paginated list of all top-level parent categories (where parentId is null).
   */
  @ApiGetAllParentCategories()
  @Get('/parent-categories')
  async getAllParentCategories(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.categoryService.getAllParentCategories({ page, limit });
  }

  /**
   * ------ GET - Get category tree
   * Retrieves the full nested tree structure of categories, mapping up to 3 levels deep.
   */
  @ApiGetCategoryTree()
  @Get('/category-tree')
  async getCategoryTree() {
    return await this.categoryService.getCategoryTreeCustomer();
  }

  /**
   * ------ GET - Get products of a category by category slug
   * Retrieves the product list based on the provided category slug.
   */
  @Get('/:slug/products')
  async getProductsOfCategory(
    @Param('slug') slug: string,
    @Query('limit') limit: number,
    @Query('cursor') cursor?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return await this.categoryService.getProductsOfCategory({
      limit,
      cursor,
      slug,
      categoryId,
      search,
    });
  }
}

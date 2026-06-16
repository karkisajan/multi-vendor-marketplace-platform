import { Controller, Get, Query } from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetAllParentCategories,
  ApiGetCategoryTree,
} from '../decorators/category-swagger.decorator';

@ApiTags('Customer Categories')
@Controller('customer/categories')
export class CustomerCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

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
    return await this.categoryService.getCategoryTree();
  }
}

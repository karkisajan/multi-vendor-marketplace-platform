import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import {
  ApiCreateCategory,
  ApiGetCategoryTree,
  ApiGetFlatCategories,
  ApiUpdateCategory,
} from '../decorators/category-swagger.decorator';
import { StatusTypeEnum } from 'src/common/enums/status-type.enum';

@ApiTags('Admin Categories')
@Controller('admin/categories')
export class AdminCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * ------ GET - Get flat categories
   * Fetches a paginated, flat list of all categories with optional filters for status, active status, and search query.
   */
  @ApiGetFlatCategories()
  @Get('/flat-categories')
  async getFlatCategories(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('status') status?: StatusTypeEnum,
    @Query('isActive') isActive?: boolean,
    @Query('query') query?: string,
  ) {
    return this.categoryService.getFlatCategories({
      page,
      limit,
      status,
      isActive,
      query,
    });
  }

  /**
   * ------ GET - Get category tree
   * Retrieves the full nested tree structure of categories, mapping up to 3 levels deep.
   */
  @ApiGetCategoryTree()
  @Get('/category-tree')
  async getCategoryTree() {
    return this.categoryService.getCategoryTree();
  }

  /**
   * ------ POST - Create category
   * Creates a new category with a unique name and automatically generated slug.
   */
  @ApiCreateCategory()
  @Post()
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.createCategory(createCategoryDto);
  }

  /**
   * ------ PUT - Update category by ID
   * Updates fields of an existing category and regenerates slug if the name changes.
   */
  @ApiUpdateCategory()
  @Put('/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCategory(id, updateCategoryDto);
  }
}

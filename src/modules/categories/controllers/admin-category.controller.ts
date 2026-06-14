import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import {
  ApiCreateCategory,
  ApiUpdateCategory,
} from '../decorators/category-swagger.decorator';
import { StatusTypeEnum } from 'src/common/enums/status-type.enum';

@ApiTags('Admin Categories')
@Controller('admin/categories')
export class AdminCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

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
   * ------ POST - Create category
   * Creates a new category with a unique name and automatically generated slug.
   */
  @ApiCreateCategory()
  @Post()
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.createCategory(createCategoryDto);
  }

  /**
   * ------ PATCH - Update category by ID
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

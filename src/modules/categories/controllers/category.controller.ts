import { Controller, Get } from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Categories')
@Controller('/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // Add request handlers below
  @Get()
  getAllCategories() {
    return 'categories has been fetched.';
  }
}

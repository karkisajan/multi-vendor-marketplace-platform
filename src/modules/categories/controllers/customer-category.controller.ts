import { Controller } from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Customer Categories')
@Controller('customer/categories')
export class CustomerCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // Add customer specific category endpoints here
}

import { Controller } from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Vendor Categories')
@Controller('vendor/categories')
export class VendorCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // Add vendor specific category endpoints here
}

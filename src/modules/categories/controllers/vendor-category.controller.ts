import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VendorCategoryService } from '../services/vendor-category.service';

@ApiTags('Vendor Categories')
@Controller('vendor/categories')
export class VendorCategoryController {
  constructor(private readonly categoryService: VendorCategoryService) {}
  // Add vendor specific category endpoints here
}

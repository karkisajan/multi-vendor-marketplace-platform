import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Vendor Categories')
@Controller('vendor/categories')
export class VendorCategoryController {
  constructor(private readonly categoryService: VendorCategoryController) {}

  // Add vendor specific category endpoints here
}

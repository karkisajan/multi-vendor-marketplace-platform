import { Injectable } from '@nestjs/common';
import { CategoryRepository } from '../repositories/category.repository';

@Injectable()
export class VendorCategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  // Add vendor category specific business logic here in the future
}

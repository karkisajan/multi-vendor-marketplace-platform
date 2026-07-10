import { PartialType } from '@nestjs/mapped-types';
import { CreateProductSpecificationDto } from './create-product-specification.dto';

/**
 * DTO for updating an existing product specification.
 * All fields are optional.
 */
export class UpdateProductSpecificationDto extends PartialType(
  CreateProductSpecificationDto,
) {}

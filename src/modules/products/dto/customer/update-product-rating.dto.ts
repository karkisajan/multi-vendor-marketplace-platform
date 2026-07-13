import { PartialType } from '@nestjs/mapped-types';
import { CreateProductRatingDto } from './create-product-rating.dto';

/**
 * All fields from CreateProductRatingDto become optional,
 * allowing partial updates without re-declaring validators.
 */
export class UpdateProductRatingDto extends PartialType(
  CreateProductRatingDto,
) {}

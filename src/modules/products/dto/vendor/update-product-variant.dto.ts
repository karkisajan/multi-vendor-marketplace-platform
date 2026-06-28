import { PartialType } from '@nestjs/mapped-types';
import { CreateProductVariantDto } from './create-product-variant.dto';

/**
 * All fields from CreateProductVariantDto become optional,
 * allowing partial updates to price, stock, or attributes without re-declaring validators.
 */
export class UpdateProductVariantDto extends PartialType(
  CreateProductVariantDto,
) {}

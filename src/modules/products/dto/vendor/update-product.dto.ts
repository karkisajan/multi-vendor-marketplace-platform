import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

/**
 * All fields from CreateProductDto become optional,
 * allowing partial updates without re-declaring validators.
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}

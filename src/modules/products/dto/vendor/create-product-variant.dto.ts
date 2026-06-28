import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Payload for adding a new variant to an existing product.
 * Required: sellingPrice, stockQuantity. Optional: crossPrice, costPrice, variantAttributes, isDefault.
 */
export class CreateProductVariantDto {
  /* Current selling price visible to customers on the storefront */
  @ApiProperty({
    example: 29.99,
    description: 'Selling price of the variant',
  })
  @Min(0, { message: 'Selling price must be a positive number.' })
  @IsNotEmpty({ message: 'Selling price is required.' })
  @IsNumber({}, { message: 'Selling price must be a valid number.' })
  sellingPrice: number;

  /* Original price shown with a strikethrough to indicate a discount */
  @ApiProperty({
    example: 49.99,
    description: 'Cross/compare-at price of the variant',
    required: false,
  })
  @IsOptional()
  @Min(0, { message: 'Cross price must be a positive number.' })
  @IsNumber({}, { message: 'Cross price must be a valid number.' })
  crossPrice?: number;

  /* Vendor's purchase cost used for internal margin calculations */
  @ApiProperty({
    example: 15.0,
    description: 'Cost price of the variant',
    required: false,
  })
  @IsOptional()
  @Min(0, { message: 'Cost price must be a positive number.' })
  @IsNumber({}, { message: 'Cost price must be a valid number.' })
  costPrice?: number;

  /* Available inventory count for this specific variant */
  @ApiProperty({
    example: 100,
    description: 'Stock quantity available for the variant',
  })
  @Min(0, { message: 'Stock quantity must be a positive number.' })
  @IsNotEmpty({ message: 'Stock quantity is required.' })
  @IsNumber({}, { message: 'Stock quantity must be a valid number.' })
  stockQuantity: number;

  /* Key-value pairs describing variant-specific traits (e.g. color, size) */
  @ApiProperty({
    example: { color: 'Black', size: 'Large' },
    description: 'Variant attributes as key-value pairs',
    required: false,
  })
  @IsOptional()
  @IsObject({ message: 'Variant attributes must be a valid JSON object.' })
  variantAttributes?: Record<string, any>;

  /* Marks this variant as the pre-selected option on the product page */
  @ApiProperty({
    example: false,
    description: 'Whether this is the default variant',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isDefault must be a boolean value.' })
  isDefault?: boolean;
}

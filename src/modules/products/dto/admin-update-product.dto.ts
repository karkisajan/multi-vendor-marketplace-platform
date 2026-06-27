import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductStatusEnum } from 'src/common/enums/product-status.enum';

/**
 * Payload for admin force-editing any product field, including status.
 * All fields are optional — admin can update any combination.
 */
export class AdminUpdateProductDto {
  /* Product title displayed in listings and search results */
  @ApiProperty({
    example: 'Updated Product Name',
    description: 'Name of the product',
    required: false,
  })
  @IsOptional()
  @MaxLength(100, {
    message: 'The product name should not exceed 100 characters.',
  })
  @IsString({ message: 'Please provide a valid product name.' })
  name?: string;

  /* Detailed product information shown on the product detail page */
  @ApiProperty({
    example: 'Updated product description with more detail',
    description: 'Description of the product',
    required: false,
  })
  @IsOptional()
  @MaxLength(300, {
    message: 'The description should not exceed 300 characters.',
  })
  @IsString({ message: 'Please provide a valid product description.' })
  description?: string;

  /* URL-friendly identifier used for SEO and product page routing */
  @ApiProperty({
    example: 'updated-product-name',
    description: 'URL slug for the product',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Slug must be a string.' })
  slug?: string;

  /* Category to which this product belongs in the catalog hierarchy */
  @ApiProperty({
    example: 'b3d7c8a0-1f2e-4a5b-9c6d-7e8f0a1b2c3d',
    description: 'UUID of the product category',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Category ID must be a valid UUID.' })
  categoryId?: string;

  /* Admin can force any lifecycle status transition */
  @ApiProperty({
    enum: ProductStatusEnum,
    example: ProductStatusEnum.PUBLISHED,
    description: 'Product status',
    required: false,
  })
  @IsOptional()
  @IsEnum(ProductStatusEnum, { message: 'Invalid product status.' })
  status?: ProductStatusEnum;
}

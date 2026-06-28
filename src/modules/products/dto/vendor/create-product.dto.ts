import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Payload for creating a new product in the marketplace.
 * Required: name. Optional: description, categoryId.
 * Status is always set to DRAFT automatically on creation.
 */
export class CreateProductDto {
  /* Product title displayed in listings and search results */
  @ApiProperty({
    example: 'Wireless Bluetooth Headphones',
    description: 'Name of the product',
  })
  @MaxLength(100, {
    message: 'The product name should not exceed 100 characters.',
  })
  @IsNotEmpty({ message: 'Product name is required.' })
  @IsString({ message: 'Please provide a valid product name.' })
  name: string;

  /* Detailed product information shown on the product detail page */
  @ApiProperty({
    example: 'High-quality wireless headphones with noise cancellation',
    description: 'Description of the product',
    required: false,
  })
  @IsOptional()
  @MaxLength(300, {
    message: 'The description should not exceed 300 characters.',
  })
  @IsString({ message: 'Please provide a valid product description.' })
  description?: string;

  /* Category to which this product belongs in the catalog hierarchy */
  @ApiProperty({
    example: 'b3d7c8a0-1f2e-4a5b-9c6d-7e8f0a1b2c3d',
    description: 'UUID of the product category',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Category ID must be a valid UUID.' })
  categoryId?: string;
}

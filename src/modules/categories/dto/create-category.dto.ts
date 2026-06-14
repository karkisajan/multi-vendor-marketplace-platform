import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusTypeEnum } from 'src/common/enums/status-type.enum';

/**
 * Payload for creating a new category in the product catalog.
 */
export class CreateCategoryDto {
  /* Human-readable label shown in navigation menus and breadcrumbs */
  @ApiProperty({ example: 'Electronics', description: 'Name of the category' })
  @IsNotEmpty({ message: 'Category name is required.' })
  @IsString({ message: 'Please provide a valid category name.' })
  @MaxLength(50, {
    message: 'The category name should not exceed 50 characters.',
  })
  name: string;

  /* Extended text displayed on the category landing page */
  @ApiProperty({
    example: 'Gadgets, devices, and accessories',
    description: 'Description of the category',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Please provide a valid category description.' })
  @MaxLength(500, {
    message: 'The description should not exceed 500 characters.',
  })
  description?: string;

  /* CDN URL for the category thumbnail image */
  @ApiProperty({
    example: 'https://cdn.example.com/categories/electronics.png',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Please provide a valid category image URL.' })
  imageUrl?: string;

  /* Parent category ID for nested category hierarchies */
  @ApiProperty({
    example: 'b3d7c8a0-1f2e-4a5b-9c6d-7e8f0a1b2c3d',
    description: 'UUID of the parent category',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Parent ID must be a valid UUID.' })
  parentId?: string;

  /* Controls whether the category appears in storefront navigation */
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value.' })
  isActive?: boolean;

  /* Publication status of the category */
  @ApiProperty({
    enum: StatusTypeEnum,
    example: StatusTypeEnum.PUBLISHED,
    description: 'Publication status of the category',
    required: false,
  })
  @IsOptional()
  @IsEnum(StatusTypeEnum, {
    message: 'Status must be a valid StatusTypeEnum value.',
  })
  status?: StatusTypeEnum;
}

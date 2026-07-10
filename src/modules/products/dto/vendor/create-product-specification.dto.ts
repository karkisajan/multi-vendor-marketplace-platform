import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a new product specification.
 */
export class CreateProductSpecificationDto {
  @ApiProperty({
    example: 'Material',
    description: 'The key/label of the specification attribute',
  })
  @MaxLength(100, {
    message: 'The specification key should not exceed 100 characters.',
  })
  @IsNotEmpty({ message: 'Specification key is required.' })
  @IsString({ message: 'Please provide a valid specification key.' })
  key: string;

  @ApiProperty({
    example: 'Aluminium',
    description: 'The value of the specification attribute',
  })
  @MaxLength(255, {
    message: 'The specification value should not exceed 255 characters.',
  })
  @IsNotEmpty({ message: 'Specification value is required.' })
  @IsString({ message: 'Please provide a valid specification value.' })
  value: string;

  @ApiProperty({
    example: 0,
    description:
      'Sorting order for displaying specifications (lower values display first)',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: 'Sort order must be an integer.' })
  @Min(0, { message: 'Sort order must be 0 or greater.' })
  sortOrder?: number;
}

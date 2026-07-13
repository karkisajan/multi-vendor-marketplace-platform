import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Payload for creating a new product rating.
 * Required: score. Optional: comment.
 */
export class CreateProductRatingDto {
  /* Numeric score from 1 (worst) to 5 (best) reflecting overall product satisfaction */
  @ApiProperty({
    example: 4,
    description: 'Rating score from 1 to 5',
  })
  @Min(1, { message: 'Score must be at least 1.' })
  @Max(5, { message: 'Score must be at most 5.' })
  @IsNotEmpty({ message: 'Score is required.' })
  @IsInt({ message: 'Score must be an integer.' })
  score: number;

  /* Free-text review accompanying the numeric score */
  @ApiProperty({
    example: 'Great product quality and fast delivery!',
    description: 'Optional review comment for the product',
    required: false,
  })
  @IsOptional()
  @MaxLength(500, {
    message: 'Comment should not exceed 500 characters.',
  })
  @IsString({ message: 'Comment must be a string.' })
  comment?: string;
}

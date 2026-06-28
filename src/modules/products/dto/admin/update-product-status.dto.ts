import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductStatusEnum } from 'src/common/enums/product-status.enum';

/**
 * Payload for admin-driven product status transitions (publish, reject, archive).
 * Required: status. Optional: reviewNote (for rejection reasons or internal notes).
 */
export class UpdateProductStatusDto {
  /* Target lifecycle status — publish makes it visible, reject sends it back to vendor */
  @ApiProperty({
    enum: ProductStatusEnum,
    example: ProductStatusEnum.PUBLISHED,
    description: 'New status for the product',
  })
  @IsNotEmpty({ message: 'Product status is required.' })
  @IsEnum(ProductStatusEnum, { message: 'Invalid product status.' })
  status: ProductStatusEnum;

  /* Admin feedback explaining why a product was rejected or archived */
  @ApiProperty({
    example: 'Product description does not meet quality standards.',
    description: 'Optional review note from admin',
    required: false,
  })
  @IsOptional()
  @MaxLength(500, {
    message: 'Review note should not exceed 500 characters.',
  })
  @IsString({ message: 'Review note must be a string.' })
  reviewNote?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID, ValidateIf } from 'class-validator';
import { BookmarkTypeEnum } from 'src/common/enums/bookmark-type.enum';

export class CreateBookmarkDto {
  /* Bookmark Type */
  @ApiProperty({
    enum: BookmarkTypeEnum,
    example: BookmarkTypeEnum.PRODUCT,
    description: 'Type of item being bookmarked',
  })
  @IsNotEmpty({ message: 'Bookmark type is required.' })
  @IsEnum(BookmarkTypeEnum, { message: 'Invalid bookmark type.' })
  bookmarkType: BookmarkTypeEnum;

  /* Product to be bookmarked */
  @ApiProperty({
    example: 'b3d7c8a0-1f2e-4a5b-9c6d-7e8f0a1b2c3d',
    required: false,
    description: 'UUID of the product to bookmark',
  })
  @ValidateIf(
    (payload: CreateBookmarkDto) =>
      payload.bookmarkType === BookmarkTypeEnum.PRODUCT,
  )
  @IsNotEmpty({ message: 'Product ID is required for product bookmarks.' })
  @IsUUID('4', { message: 'Product ID must be a valid UUID.' })
  productId: string;

  /* Vendor-business to be bookmarked */
  @ApiProperty({
    example: 'b3d7c8a0-1f2e-4a5b-9c6d-7e8f0a1b2c3d',
    required: false,
    description: 'UUID of the vendor business to bookmark',
  })
  @ValidateIf(
    (payload: CreateBookmarkDto) =>
      payload.bookmarkType === BookmarkTypeEnum.BUSINESS,
  )
  @IsNotEmpty({
    message: 'Vendor profile ID is required for business bookmarks.',
  })
  @IsUUID('4', { message: 'Vendor profile ID must be a valid UUID.' })
  vendorId: string;
}

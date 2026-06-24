import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Payload for updating a vendor user's profile.
 * All fields are optional.
 */
export class UpdateVendorDto {
  /* Legal or registered name of the business entity */
  @ApiProperty({
    example: 'Acme Corp',
    description: 'Registered business name of the vendor',
    required: false,
  })
  @IsOptional()
  @MinLength(3, { message: 'Business name should be of atleast 3 characters.' })
  @IsString({ message: 'Business name must be a string.' })
  businessName?: string;

  /* CDN URL for the vendor business profile/logo image */
  @ApiProperty({
    example: 'https://cdn.example.com/profiles/acme.png',
    description: 'URL of the business profile logo',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Business profile URL must be a string.' })
  businessProfileUrl?: string;

  /* Contact phone number in E.164 format */
  @ApiProperty({ example: '+9779812345678', required: false })
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Invalid phone number format.',
  })
  @IsString({ message: 'Invalid phone number format.' })
  phoneNumber?: string;
}

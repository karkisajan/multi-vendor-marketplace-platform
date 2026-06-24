import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Payload for updating a customer user's profile.
 * All fields are optional.
 */
export class UpdateCustomerDto {
  /* First name displayed on the customer's public profile */
  @ApiProperty({
    example: 'John',
    description: 'First name of the user',
    required: false,
  })
  @IsOptional()
  @MinLength(3, { message: 'First name should be of atleast 3 characters.' })
  @IsString({ message: 'First name must be a string.' })
  firstName?: string;

  /* Last name displayed on the customer's public profile */
  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the user',
    required: false,
  })
  @IsOptional()
  @MinLength(3, { message: 'Last name should be of atleast 3 characters.' })
  @IsString({ message: 'Last name must be a string.' })
  lastName?: string;

  /* CDN URL for the customer profile image */
  @ApiProperty({
    example: 'https://cdn.example.com/profiles/john.png',
    description: 'URL of the customer profile picture',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Profile URL must be a string.' })
  profileUrl?: string;

  /* Contact phone number in E.164 format */
  @ApiProperty({ example: '+9779812345678', required: false })
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Invalid phone number format.',
  })
  @IsString({ message: 'Invalid phone number format.' })
  phoneNumber?: string;
}

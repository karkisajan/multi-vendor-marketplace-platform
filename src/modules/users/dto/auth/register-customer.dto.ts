import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { UserStatusEnum } from 'src/common/enums/user-status.enum';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Payload for registering a new customer account.
 */
export class RegisterCustomerDto {
  /* First name displayed on the customer's public profile */
  @ApiProperty({ example: 'John', description: 'First name of the user' })
  @MinLength(3, { message: 'First name should be of atleast 3 characters.' })
  @IsNotEmpty({ message: 'First name is required.' })
  @IsString({ message: 'First name must be a string.' })
  firstName: string;

  /* Last name displayed on the customer's public profile */
  @ApiProperty({ example: 'Doe', description: 'Last name of the user' })
  @MinLength(3, { message: 'Last name should be of atleast 3 characters.' })
  @IsNotEmpty({ message: 'Last name is required.' })
  @IsString({ message: 'Last name must be a string.' })
  lastName: string;

  /* Email address used for authentication and account recovery */
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email of the user',
  })
  @IsEmail({}, { message: 'Invalid email format.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;

  /* Account password — enforces uppercase, lowercase, digit, and special char */
  @ApiProperty({ example: 'Password@123', description: 'Password of the user' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
    {
      message:
        'Password is too weak. It must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;

  /* Password confirmation to prevent entry errors */
  @ApiProperty({
    example: 'Password@123',
    description: 'Confirm password must match password',
  })
  @IsNotEmpty({ message: 'Confirm password is required.' })
  @IsString({ message: 'Confirm password must be a string.' })
  confirmPassword: string;

  /* Current activation state of the user account */
  @ApiProperty({ enum: UserStatusEnum, required: false })
  @IsOptional()
  @IsEnum(UserStatusEnum, { message: 'Invalid user status.' })
  status: string;

  /* Contact phone number in E.164 format */
  @ApiProperty({ example: '+9779812345678', required: false })
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Invalid phone number format.',
  })
  @IsString({ message: 'Invalid phone number format.' })
  phoneNumber?: string;
}

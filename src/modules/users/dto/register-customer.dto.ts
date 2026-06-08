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

export class RegisterCustomerDto {
  /* Username */
  @ApiProperty({ example: 'John', description: 'First name of the user' })
  @MinLength(3, { message: 'First name should be of atleast 3 characters.' })
  @IsNotEmpty({ message: 'First name is required.' })
  @IsString({ message: 'First name must be a string.' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the user' })
  @MinLength(3, { message: 'Last name should be of atleast 3 characters.' })
  @IsNotEmpty({ message: 'Last name is required.' })
  @IsString({ message: 'Last name must be a string.' })
  lastName: string;

  /* Email */
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email of the user',
  })
  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Invalid email format.' })
  email: string;

  /* Password */
  @ApiProperty({ example: 'Password@123', description: 'Password of the user' })
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
    {
      message:
        'Password is too weak. It must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  password: string;

  /* Confirm password */
  @ApiProperty({
    example: 'Password@123',
    description: 'Confirm password must match password',
  })
  @IsNotEmpty({ message: 'Confirm password is required.' })
  confirmPassword: string;

  /* User status weather active or inactive */
  @ApiProperty({ enum: UserStatusEnum, required: false })
  @IsOptional()
  @IsEnum(UserStatusEnum, { message: 'Invalid user status.' })
  status: string;

  /* Phone number */
  @ApiProperty({ example: '+9779812345678', required: false })
  @IsOptional()
  @IsString({ message: 'Invalid phone number format.' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Invalid phone number format.',
  })
  phoneNumber?: string;
}

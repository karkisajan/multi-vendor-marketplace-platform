import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
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
  password: string;
}

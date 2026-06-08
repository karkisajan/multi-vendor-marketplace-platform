import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgetPasswordDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email of the user requesting a password reset',
  })
  @IsEmail({}, { message: 'Please enter a valid email.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;
}

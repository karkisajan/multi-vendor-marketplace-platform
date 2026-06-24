import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Payload for requesting a password reset link.
 */
export class ForgetPasswordDto {
  /* Email address where the reset instructions will be sent */
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email of the user requesting a password reset',
  })
  @IsEmail({}, { message: 'Please enter a valid email.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;
}

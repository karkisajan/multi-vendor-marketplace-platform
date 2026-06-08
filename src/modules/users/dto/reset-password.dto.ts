import { IsNotEmpty, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Password reset token received via email',
  })
  @IsNotEmpty({ message: 'Please provide a token to reset your password.' })
  resetToken: string;

  @ApiProperty({
    example: 'NewPassword@123',
    description:
      'New password (min 6 chars, must include uppercase, lowercase, number, and special character)',
  })
  @IsNotEmpty({ message: 'Please provide a new password' })
  @MinLength(6, { message: 'Passwords must be six characters long.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character!',
    },
  )
  newPassword: string;
}

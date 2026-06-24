import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Payload for resetting the account password.
 */
export class ResetPasswordDto {
  /* One-time verification token received via email */
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Password reset token received via email',
  })
  @IsNotEmpty({ message: 'Please provide a token to reset your password.' })
  @IsString({ message: 'Reset token must be a string.' })
  resetToken: string;

  /* New secure password to associate with the account */
  @ApiProperty({
    example: 'NewPassword@123',
    description:
      'New password (min 6 chars, must include uppercase, lowercase, number, and special character)',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character!',
    },
  )
  @MinLength(6, { message: 'Passwords must be six characters long.' })
  @IsNotEmpty({ message: 'Please provide a new password.' })
  @IsString({ message: 'New password must be a string.' })
  newPassword: string;
}

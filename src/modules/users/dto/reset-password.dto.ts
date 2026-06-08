import { IsNotEmpty, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  /* Reset token */
  @IsNotEmpty({ message: 'Please provide a token to reset your password.' })
  resetToken: string;

  /* New password */
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

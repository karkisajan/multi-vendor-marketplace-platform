import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'The refresh token issued during login' })
  @IsNotEmpty({ message: 'Refresh token is required.' })
  refreshToken: string;
}

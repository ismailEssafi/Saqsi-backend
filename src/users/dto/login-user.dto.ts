import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
export class LoginUserDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{10}$/)
  public phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  public password: string;
}

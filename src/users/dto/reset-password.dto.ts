import { IsNotEmpty, IsString, MinLength } from 'class-validator';
export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  public userId: string;

  @IsString()
  @IsNotEmpty()
  public codeOTP: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  public password: string;
}

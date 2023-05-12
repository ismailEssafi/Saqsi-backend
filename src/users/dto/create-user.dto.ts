import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z ]{3,10}$/)
  public fullname: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{10}$/)
  public phoneNumber: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  public password: string;
}

import { IsEmail, IsString, MinLength } from 'class-validator';

export class BootstrapAdminDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;
}

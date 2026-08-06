import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '../../auth/auth.types.js';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsEnum(Role)
  role!: Role;
}

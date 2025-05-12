import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '../entities/users.entity';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Nombre completo del usuario',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @ApiProperty({
    example: 'StrongP@ss123',
    description:
      'Contraseña del usuario (mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números o caracteres especiales)',
  })
  @IsString()
  @Length(8, 30, {
    message: 'La contraseña debe tener entre 8 y 30 caracteres',
  })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número o carácter especial',
  })
  password: string;

  @ApiProperty({
    example: '1990-01-01',
    description: 'Fecha de nacimiento del usuario',
  })
  @IsNotEmpty({ message: 'La fecha de nacimiento es requerida' })
  birthdate: string;

  @ApiProperty({
    example: 'male',
    description: 'Género del usuario (male, female, other)',
  })
  @IsNotEmpty({ message: 'El género es requerido' })
  gender: string;

  @ApiProperty({
    example: 1,
    description: 'Tipo de usuario (0, 1, 2)',
  })
  @IsNotEmpty({ message: 'El tipo de usuario es requerido' })
  userType: number;

  @ApiProperty({
    example: UserType.INSTRUCTOR,
    description: 'Tipo de usuario',
    enum: UserType,
    enumName: 'UserType',
  })
  @IsEnum(UserType, { message: 'Tipo de usuario inválido' })
  @IsNotEmpty({ message: 'El tipo de usuario es requerido' })
  userTypeEnum: UserType;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Nombre completo del usuario',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'StrongP@ss123',
    description:
      'Contraseña del usuario (mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números o caracteres especiales)',
  })
  @IsString()
  @Length(8, 30, {
    message: 'La contraseña debe tener entre 8 y 30 caracteres',
  })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número o carácter especial',
  })
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    example: '1990-01-01',
    description: 'Fecha de nacimiento del usuario',
  })
  @IsOptional()
  birthdate?: string;

  @ApiPropertyOptional({
    example: 'male',
    description: 'Género del usuario (male, female, other)',
  })
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Tipo de usuario (0, 1, 2)',
  })
  @IsOptional()
  userType?: number;
}

export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'ID único del usuario' })
  id: number;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Correo electrónico del usuario',
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Nombre completo del usuario',
  })
  name: string;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Fecha de creación del usuario',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Fecha de última actualización del usuario',
  })
  updatedAt: Date;

  @ApiProperty({
    example: true,
    description: 'Indica si el usuario es un instructor',
  })
  isInstructor: boolean;
}

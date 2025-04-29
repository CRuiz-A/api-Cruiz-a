import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}

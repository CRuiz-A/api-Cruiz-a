import { IsNotEmpty, IsString, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({ example: 'Salsa Nivel 1', description: 'Nombre de la clase' })
  @IsString()
  @IsNotEmpty()
  nombreClase: string;

  @ApiProperty({ example: '2025-12-31', description: 'Fecha de la clase (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  fecha: string;

  @ApiProperty({ example: '18:00', description: 'Hora de inicio (HH:mm)' })
  @IsString() // Using string for time for simplicity based on form input type
  @IsNotEmpty()
  horaInicio: string;

  @ApiProperty({ example: '19:30', description: 'Hora de fin (HH:mm)' })
  @IsString() // Using string for time for simplicity based on form input type
  @IsNotEmpty()
  horaFin: string;

  @ApiProperty({ example: 1, description: 'ID del instructor' })
  @IsNumber()
  @IsNotEmpty()
  instructorId: number; // Assuming we use instructor ID
}

export class ClassResponseDto {
  @ApiProperty({ example: 1, description: 'ID único de la clase' })
  id: number;

  @ApiProperty({ example: 'Salsa Nivel 1', description: 'Nombre de la clase' })
  nombreClase: string;

  @ApiProperty({ example: '2025-12-31', description: 'Fecha de la clase (YYYY-MM-DD)' })
  fecha: string;

  @ApiProperty({ example: '18:00', description: 'Hora de inicio (HH:mm)' })
  horaInicio: string;

  @ApiProperty({ example: '19:30', description: 'Hora de fin (HH:mm)' })
  horaFin: string;

  @ApiProperty({ example: { id: 1, name: 'John Doe' }, description: 'Información del instructor' })
  instructor: { id: number; name: string }; // Simplified instructor info

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: 'Fecha de última actualización' })
  updatedAt: Date;
}

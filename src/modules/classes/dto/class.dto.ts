import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateClassDto {
  @IsString()
  nombreClase: string;

  @IsNotEmpty()
  @IsDateString()
  fecha: string;

  @IsString()
  horaInicio: string;

  @IsString()
  horaFin: string;

  @IsNotEmpty()
  @IsNumber()
  instructorId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  studentIds: number[];
}

import { Controller, Get, Query, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { UsersService } from '../users/users.service'; // Import UsersService
import { UserResponseDto } from '../users/DTO/users.dto'; // Import UserResponseDto
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody, // Import ApiBody
  ApiParam, // Import ApiParam
} from '@nestjs/swagger'; // Import Swagger decorators

@ApiTags('Clases') // Add ApiTags for Swagger documentation
@Controller('classes')
export class ClassesController {
  constructor(
    private readonly classesService: ClassesService,
    private readonly usersService: UsersService, // Inject UsersService
  ) {}

  @Get('by-date')
  @ApiOperation({ summary: 'Obtener clases por fecha' }) // Add Swagger operation summary
  @ApiResponse({ status: 200, description: 'Clases encontradas exitosamente' }) // Add Swagger response
  @ApiQuery({ name: 'date', description: 'Fecha en formato YYYY-MM-DD' }) // Add Swagger query parameter
  async findClassesByDate(@Query('date') date: string) {
    // Assuming 'America/Bogota' timezone for now, this could be made dynamic
    return this.classesService.getClassesByDate(date, 'America/Bogota');
  }

  @Get('by-student-email')
  @ApiOperation({ summary: 'Obtener clases por correo de estudiante' }) // Add Swagger operation summary
  @ApiResponse({ status: 200, description: 'Clases encontradas exitosamente' }) // Add Swagger response
  @ApiQuery({ name: 'email', description: 'Correo electrónico del estudiante' }) // Add Swagger query parameter
  async findClassesByStudentEmail(@Query('email') email: string) {
    return this.classesService.getClassesByStudentEmail(email);
  }

  @Post('enroll-student')
  @ApiOperation({ summary: 'Agendar estudiante a una clase' }) // Add Swagger operation summary
  @ApiResponse({ status: 201, description: 'Estudiante agendado exitosamente' }) // Add Swagger response
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        classId: { type: 'number', example: 1 },
        studentEmail: { type: 'string', example: 'student@example.com' },
      },
    },
  }) // Add Swagger body description
  async enrollStudentInClass(
    @Body('classId') classId: number,
    @Body('studentEmail') studentEmail: string,
  ) {
    return this.classesService.enrollStudentInClass(classId, studentEmail);
  }

  @Get(':classId/students')
  @ApiOperation({ summary: 'Obtener estudiantes por ID de clase' }) // Add Swagger operation summary
  @ApiResponse({ status: 200, description: 'Estudiantes encontrados exitosamente' }) // Add Swagger response
  @ApiParam({ name: 'classId', description: 'ID de la clase' }) // Use ApiParam for description
  async getStudentsByClassId(@Param('classId') classId: number) {
    return this.classesService.getStudentsByClassId(classId);
  }

  @Get('search-user') // New endpoint path
  @ApiOperation({ summary: 'Buscar usuario por correo electrónico (en módulo Classes)' }) // Add Swagger operation summary
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado exitosamente',
    type: UserResponseDto,
  }) // Add Swagger response
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' }) // Add Swagger response
  @ApiQuery({ name: 'email', description: 'Correo electrónico del usuario a buscar' }) // Add Swagger query parameter
  async searchUserByEmail(@Query('email') email: string): Promise<UserResponseDto> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    // Include isInstructor logic here
    const isInstructor = user.userType === 2; // Assuming 2 is the userType for instructor
    const { password, ...result } = user;
    return { ...result, isInstructor } as UserResponseDto;
  }
}

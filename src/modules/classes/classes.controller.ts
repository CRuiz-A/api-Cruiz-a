import { Controller, Get, Query, Post, Body, Param } from '@nestjs/common';
import { ClassesService } from './classes.service';

@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get
  ('by-date')
  async findClassesByDate(@Query('date') date: string) {
    // Assuming 'America/Bogota' timezone for now, this could be made dynamic
    return this.classesService.getClassesByDate(date, 'America/Bogota');
  }

  @Get('by-student-email')
  async findClassesByStudentEmail(@Query('email') email: string) {
    return this.classesService.getClassesByStudentEmail(email);
  }

  @Post('enroll-student')
  async enrollStudentInClass(
    @Body('classId') classId: number,
    @Body('studentEmail') studentEmail: string,
  ) {
    return this.classesService.enrollStudentInClass(classId, studentEmail);
  }

  @Get(':classId/students')
  async getStudentsByClassId(@Param('classId') classId: number) {
    return this.classesService.getStudentsByClassId(classId);
  }
}

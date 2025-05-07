import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/class.dto';

@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  create(@Body() dto: CreateClassDto) {
    return this.classesService.create(dto);
  }

  @Get('student')
  getByStudentEmail(@Query('email') email: string) {
    return this.classesService.getClassesByStudentEmail(email);
  }
}

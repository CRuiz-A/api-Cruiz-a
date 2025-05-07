import { Controller, Get, Query } from '@nestjs/common';
import { ClassesService } from './classes.service';

@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get('by-date')
  async findClassesByDate(@Query('date') date: string) {
    // Assuming 'America/Bogota' timezone for now, this could be made dynamic
    return this.classesService.getClassesByDate(date, 'America/Bogota');
  }
}

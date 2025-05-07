import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { Class } from './entities/class.entity';
import { ClassStudent } from './entities/class-student.entity';
import { User } from '../users/entities/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Class, ClassStudent, User])],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}

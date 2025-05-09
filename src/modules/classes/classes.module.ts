import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { Class } from './entities/class.entity';
import { ClassStudent } from './entities/class-student.entity';
import { User } from '../users/entities/users.entity';
import { UsersModule } from '../users/users.module'; // Import UsersModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Class, ClassStudent, User]),
    UsersModule, // Import UsersModule to make UsersService available
  ],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}

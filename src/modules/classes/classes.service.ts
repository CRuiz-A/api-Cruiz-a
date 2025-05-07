import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { User } from '../users/entities/users.entity';
import { ClassStudent } from './entities/class-student.entity';
import { CreateClassDto } from './dto/class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classRepo: Repository<Class>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(ClassStudent)
    private classStudentRepo: Repository<ClassStudent>,
  ) {}

  async create(createClassDto: CreateClassDto) {
    const instructor = await this.userRepo.findOneByOrFail({ id: createClassDto.instructorId });

    const newClass = this.classRepo.create({
      nombreClase: createClassDto.nombreClase,
      fecha: createClassDto.fecha,
      horaInicio: createClassDto.horaInicio,
      horaFin: createClassDto.horaFin,
      instructor,
    });

    const savedClass = await this.classRepo.save(newClass);

    const classStudents = createClassDto.studentIds.map(studentId => {
      return this.classStudentRepo.create({
        class: savedClass,
        student: { id: studentId } as User,
      });
    });

    await this.classStudentRepo.save(classStudents);
    return savedClass;
  }

  async getClassesByStudentEmail(email: string) {
    return this.classRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.instructor', 'i')
      .leftJoinAndSelect('c.students', 'cs')
      .leftJoinAndSelect('cs.student', 's')
      .where('s.email = :email', { email })
      .andWhere('i.userType = 2')
      .andWhere('s.userType = 1')
      .orderBy('c.fecha', 'ASC')
      .addOrderBy('c.horaInicio', 'ASC')
      .addOrderBy('c.nombreClase', 'ASC')
      .getMany();
  }
}

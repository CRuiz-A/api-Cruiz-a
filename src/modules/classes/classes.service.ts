import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Class } from './entities/class.entity';
import { User } from '../users/entities/users.entity';
import { ClassStudent } from './entities/class-student.entity';
import { CreateClassDto } from './dto/class.dto';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay } from 'date-fns';

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

    // Check for duplicate class
    // Convert the date string to a Date object in the specified timezone for comparison
    const classDateInTimezone = fromZonedTime(createClassDto.fecha, 'America/Bogota');

    const existingClass = await this.classRepo.findOne({
      where: {
        nombreClase: createClassDto.nombreClase,
        fecha: classDateInTimezone,
        horaInicio: createClassDto.horaInicio,
        instructor: { id: createClassDto.instructorId },
      },
    });

    if (existingClass) {
      throw new ConflictException('A class with the same name, date, start time, and instructor already exists.');
    }

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

  async getClassesByDate(dateString: string, timezone: string) {
    const dateInTimezone = fromZonedTime(dateString, timezone);
    const start = startOfDay(dateInTimezone);
    const end = endOfDay(dateInTimezone);

    return this.classRepo.find({
      where: {
        fecha: Between(start, end),
      },
      relations: ['instructor', 'students', 'students.student'],
      order: {
        fecha: 'ASC',
        horaInicio: 'ASC',
        nombreClase: 'ASC',
      },
    });
  }
}

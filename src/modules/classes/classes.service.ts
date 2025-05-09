import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'; // Import NotFoundException
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Class } from './entities/class.entity';
import { User } from '../users/entities/users.entity';
import { ClassStudent } from './entities/class-student.entity';
import { CreateClassDto as EnrollStudentDto } from './dto/class.dto'; // Rename existing DTO import
import { CreateClassDto, ClassResponseDto } from './DTO/classes.dto'; // Import new DTOs
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

  // Renamed existing create method to enrollStudent
  async enrollStudent(enrollStudentDto: EnrollStudentDto) {
    const instructor = await this.userRepo.findOneByOrFail({ id: enrollStudentDto.instructorId });

    // Check for duplicate class
    // Convert the date string to a Date object in the specified timezone for comparison
    const classDateInTimezone = fromZonedTime(enrollStudentDto.fecha, 'America/Bogota');

    const existingClass = await this.classRepo.findOne({
      where: {
        nombreClase: enrollStudentDto.nombreClase,
        fecha: classDateInTimezone,
        horaInicio: enrollStudentDto.horaInicio,
        instructor: { id: enrollStudentDto.instructorId },
      },
    });

    if (existingClass) {
      throw new ConflictException('A class with the same name, date, start time, and instructor already exists.');
    }

    const newClass = this.classRepo.create({
      nombreClase: enrollStudentDto.nombreClase,
      fecha: enrollStudentDto.fecha,
      horaInicio: enrollStudentDto.horaInicio,
      horaFin: enrollStudentDto.horaFin,
      instructor,
    });

    const savedClass = await this.classRepo.save(newClass);

    const classStudents = enrollStudentDto.studentIds.map(studentId => {
      return this.classStudentRepo.create({
        class: savedClass,
        student: { id: studentId } as User,
      });
    });

    await this.classStudentRepo.save(classStudents);
    return savedClass;
  }

  // New method to create a Class
  async createClass(createClassDto: CreateClassDto): Promise<ClassResponseDto> {
    // Find the instructor
    const instructor = await this.userRepo.findOne({
      where: { id: createClassDto.instructorId, userType: 2 }, // Ensure user is an instructor
    });

    if (!instructor) {
      throw new NotFoundException(`Instructor with ID ${createClassDto.instructorId} not found or is not an instructor.`);
    }

    // Check for duplicate class (optional, depending on requirements)
    // For simplicity, skipping duplicate check based on all fields for now.
    // A more robust check might involve date, time, and instructor.

    // Create the new class entity
    const newClass = this.classRepo.create({
      nombreClase: createClassDto.nombreClase,
      fecha: createClassDto.fecha,
      horaInicio: createClassDto.horaInicio,
      horaFin: createClassDto.horaFin,
      instructor: instructor, // Link the instructor entity
    });

    // Save the class
    const savedClass = await this.classRepo.save(newClass);

    // Return ClassResponseDto
    // Return ClassResponseDto
    const classResponse: ClassResponseDto = {
      id: savedClass.id,
      nombreClase: savedClass.nombreClase,
      fecha: savedClass.fecha.toISOString().split('T')[0], // Format Date to YYYY-MM-DD string
      horaInicio: savedClass.horaInicio,
      horaFin: savedClass.horaFin,
      instructor: { id: instructor.id, name: instructor.name }, // Include simplified instructor info
      createdAt: savedClass.createdAt, // Include createdAt
      updatedAt: savedClass.updatedAt, // Include updatedAt
    };

    return classResponse;
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

  async enrollStudentInClass(classId: number, studentEmail: string) {
    const student = await this.userRepo.findOne({ where: { email: studentEmail, userType: 1 } });
    const classToEnroll = await this.classRepo.findOne({ where: { id: classId } });

    if (!student) {
      throw new Error(`Student with email ${studentEmail} not found.`);
    }

    if (!classToEnroll) {
      throw new Error(`Class with ID ${classId} not found.`);
    }

    // Check if the student is already in the class
    const existingClassStudent = await this.classStudentRepo.findOne({
      where: {
        class: { id: classToEnroll.id },
        student: { id: student.id },
      },
    });

    if (existingClassStudent) {
      throw new ConflictException(`El estudiante con correo ${studentEmail} ya está inscrito en la clase con ID ${classId}.`);
    }

    const classStudent = this.classStudentRepo.create({
      class: classToEnroll,
      student: student,
    });

    await this.classStudentRepo.save(classStudent);
    return { success: true, message: 'Student enrolled successfully.' };
  }

  async getStudentsByClassId(classId: number) {
    const classStudents = await this.classStudentRepo.find({
      where: { class: { id: classId } },
      relations: ['student'],
    });

    if (!classStudents || classStudents.length === 0) {
      // Optionally, check if the class exists at all if no students are found
      const classExists = await this.classRepo.findOne({ where: { id: classId } });
      if (!classExists) {
        throw new Error(`Class with ID ${classId} not found.`);
      }
      return []; // Return empty array if class exists but has no students
    }

    return classStudents.map(cs => cs.student);
  }
}

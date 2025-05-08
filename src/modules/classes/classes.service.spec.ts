import { Test, TestingModule } from '@nestjs/testing';
import { ClassesService } from './classes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Class } from './entities/class.entity';
import { ClassStudent } from './entities/class-student.entity';
import { UsersService } from '../users/users.service';
import { CreateClassDto } from './dto/class.dto';
import { User } from '../users/entities/users.entity';
import { Repository } from 'typeorm'; // Import Repository

describe('ClassesService', () => {
  let service: ClassesService;
  let classRepository: MockClassRepository; // Use MockClassRepository type
  let classStudentRepository: MockClassStudentRepository; // Use MockClassStudentRepository type
  let usersService: UsersService; // Use UsersService type
  let userRepository: MockUserRepository; // Mock UserRepository

  // Create mock repository classes
  class MockUserRepository extends Repository<User> {
    findOneByOrFail = jest.fn(); // Add mock for findOneByOrFail
  }

  class MockClassRepository extends Repository<Class> {
    create = jest.fn(); // Add mock for create
    save = jest.fn(); // Keep save mock
  }

  class MockClassStudentRepository extends Repository<ClassStudent> {
    create = jest.fn(); // Add mock for create
    save = jest.fn(); // Keep save mock
  }


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        {
          provide: getRepositoryToken(Class),
          useClass: MockClassRepository, // Use mock class repository
        },
        {
          provide: getRepositoryToken(ClassStudent),
          useClass: MockClassStudentRepository, // Use mock class student repository
        },
        {
          provide: UsersService,
          useValue: { // Mock UsersService
            findById: jest.fn(), // Include findById
          },
        },
        {
          provide: getRepositoryToken(User), // Provide UserRepository
          useClass: MockUserRepository, // Use the mock user repository class
        },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
    classRepository = module.get<MockClassRepository>(getRepositoryToken(Class));
    classStudentRepository = module.get<MockClassStudentRepository>(getRepositoryToken(ClassStudent));
    usersService = module.get<UsersService>(UsersService);
    userRepository = module.get<MockUserRepository>(getRepositoryToken(User)); // Get MockUserRepository
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a class with an instructor', async () => {
    const createClassDto: CreateClassDto = {
      nombreClase: 'Test Class',
      fecha: '2025-05-06',
      horaInicio: '10:00',
      horaFin: '11:00',
      instructorId: 1,
      studentIds: [2, 3],
    };

    const instructorUser: User = {
      id: 1,
      name: 'Instructor User',
      email: 'instructor@example.com',
      password: 'hashedpassword',
      birthdate: '1990-01-01',
      gender: 'male',
      userType: 2,
      classes: [],
      classStudents: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      hashPassword: async () => {}, // Mock the method
      comparePassword: async () => true, // Mock the method
    };

    const createdClass = { ...createClassDto, id: 1 }; // Mock created class
    const createdClassStudents = createClassDto.studentIds.map(studentId => ({ classId: createdClass.id, studentId })); // Mock created class students

    userRepository.findOneByOrFail.mockResolvedValue(instructorUser); // Mock findOneByOrFail on the user repository
    classRepository.create.mockReturnValue(createdClass); // Mock create on class repository
    classRepository.save.mockResolvedValue(createdClass as any); // Mock save on class repository
    classStudentRepository.create.mockImplementation((dto) => dto); // Mock create on class student repository
    classStudentRepository.save.mockResolvedValue({} as any); // Mock save on class student repository

    const result = await service.create(createClassDto);

    expect(userRepository.findOneByOrFail).toHaveBeenCalledWith({ id: createClassDto.instructorId }); // Expect findOneByOrFail to be called

    // Adjust the expected object for classRepository.create
    const expectedClassCreateObject = {
      nombreClase: createClassDto.nombreClase,
      fecha: createClassDto.fecha,
      horaInicio: createClassDto.horaInicio,
      horaFin: createClassDto.horaFin,
      instructor: instructorUser, // Expect the full instructor object
    };
    expect(classRepository.create).toHaveBeenCalledWith(expectedClassCreateObject); // Expect create on class repository to be called with the adjusted object

    expect(classRepository.save).toHaveBeenCalledWith(createdClass); // Expect save on class repository to be called
    expect(classStudentRepository.create).toHaveBeenCalledTimes(createClassDto.studentIds.length); // Expect create on class student repository to be called for each student
    expect(classStudentRepository.save).toHaveBeenCalledTimes(1); // Expect save on class student repository to be called once with an array
    expect(result).toEqual(createdClass); // Expect the result to be the created class
  });
});
  it('should return students for a given class ID', async () => {
    const classId = 18;
    const mockStudents = [
      { id: 1, name: 'Student 1', email: 'student1@example.com' },
      { id: 2, name: 'Student 2', email: 'student2@example.com' },
    ];

    classStudentRepository.find = jest.fn().mockResolvedValue(mockStudents);

    const result = await service.getStudentsByClassId(classId);

    expect(classStudentRepository.find).toHaveBeenCalledWith({
      where: { classId },
      relations: ['student'], // Assuming there's a 'student' relation in ClassStudent entity
    });
    expect(result).toEqual(mockStudents);
  });
});

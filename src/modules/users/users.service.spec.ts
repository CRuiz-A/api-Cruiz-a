import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { CreateUserDto, UserResponseDto } from './DTO/users.dto';
import { Repository } from 'typeorm'; // Import Repository
import { ConflictException, InternalServerErrorException } from '@nestjs/common'; // Import exceptions

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: MockRepository; // Use MockRepository type

  // Create a mock repository class
  class MockRepository extends Repository<User> {
    create = jest.fn();
    save = jest.fn();
    findOne = jest.fn();
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useClass: MockRepository, // Use the mock repository class
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an instructor user successfully', async () => {
    const createUserDto: CreateUserDto = {
      name: 'Instructor User',
      email: 'instructor@example.com',
      password: 'password123',
      birthdate: '1990-01-01',
      gender: 'male',
      userType: 2, // Instructor type
    };

    // Adjust the mock savedUser to only include properties in UserResponseDto
    const savedUser = { id: 1, name: createUserDto.name, email: createUserDto.email, createdAt: new Date(), updatedAt: new Date() };
    const userResponseDto: UserResponseDto = { id: 1, name: savedUser.name, email: savedUser.email, createdAt: savedUser.createdAt, updatedAt: savedUser.updatedAt };

    userRepository.findOne.mockResolvedValue(null); // User does not exist
    userRepository.create.mockReturnValue(savedUser); // Return the created user
    userRepository.save.mockResolvedValue(savedUser); // Return the saved user

    const result = await service.create(createUserDto);

    expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
    expect(userRepository.create).toHaveBeenCalledWith(createUserDto);
    expect(userRepository.save).toHaveBeenCalledWith(savedUser);
    expect(result).toEqual(userResponseDto);
  });

  it('should throw ConflictException if user already exists', async () => {
    const createUserDto: CreateUserDto = {
      name: 'Existing User',
      email: 'existing@example.com',
      password: 'password123',
      birthdate: '1990-01-01',
      gender: 'male',
      userType: 1,
    };

    const existingUser = { ...createUserDto, id: 1, createdAt: new Date(), updatedAt: new Date() };

    userRepository.findOne.mockResolvedValue(existingUser as any); // User already exists

    await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
    expect(userRepository.create).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('should throw InternalServerErrorException on save error', async () => {
    const createUserDto: CreateUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      birthdate: '1990-01-01',
      gender: 'male',
      userType: 1,
    };

    userRepository.findOne.mockResolvedValue(null); // User does not exist
    userRepository.create.mockReturnValue(createUserDto); // Return the created user
    userRepository.save.mockRejectedValue(new Error('Database error')); // Simulate a database error

    await expect(service.create(createUserDto)).rejects.toThrow(InternalServerErrorException);
    expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
    expect(userRepository.create).toHaveBeenCalledWith(createUserDto);
    expect(userRepository.save).toHaveBeenCalledWith(createUserDto);
  });
});

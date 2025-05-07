import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './DTO/users.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an instructor user', async () => {
    const createUserDto: CreateUserDto = {
      name: 'Instructor User',
      email: 'instructor@example.com',
      password: 'password123',
      birthdate: '1990-01-01',
      gender: 'male',
      userType: 2, // Instructor type
    };

    jest.spyOn(service, 'create').mockResolvedValue(createUserDto as any);

    const result = await controller.create(createUserDto);
    expect(service.create).toHaveBeenCalledWith(createUserDto);
    expect(result).toEqual(createUserDto);
  });
});

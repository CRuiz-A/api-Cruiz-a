import { Test, TestingModule } from '@nestjs/testing';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/class.dto';

describe('ClassesController', () => {
  let controller: ClassesController;
  let service: ClassesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassesController],
      providers: [
        {
          provide: ClassesService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ClassesController>(ClassesController);
    service = module.get<ClassesService>(ClassesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

    jest.spyOn(service, 'create').mockResolvedValue(createClassDto as any);

    const result = await controller.create(createClassDto);
    expect(service.create).toHaveBeenCalledWith(createClassDto);
    expect(result).toEqual(createClassDto);
  });
});

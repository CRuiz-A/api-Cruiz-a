import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserType, UserTypeNames } from './entities/users.entity';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './DTO/users.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.findByEmail(createUserDto.email);
      if (existingUser) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }

      // Crear y guardar el nuevo usuario
      const user = this.usersRepository.create(createUserDto);
      const savedUser = await this.usersRepository.save(user);

      // Devolver usuario sin la contraseña
      const { password, ...result } = savedUser;
      const isInstructor = savedUser.userType === 2;
      return { ...result, isInstructor } as UserResponseDto;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear el usuario');
    }
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find();
    return users.map((user) => {
      const { password, ...result } = user;
      const isInstructor = user.userType === 2;
      return { ...result, isInstructor } as UserResponseDto;
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      // Verificar si el usuario existe
      const user = await this.findById(id);

      // Si se está actualizando el email, verificar que no exista otro usuario con ese email
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.findByEmail(updateUserDto.email);
        if (existingUser) {
          throw new ConflictException(
            'El correo electrónico ya está registrado',
          );
        }
      }

      // Actualizar el usuario
      this.usersRepository.merge(user, updateUserDto);
      const updatedUser = await this.usersRepository.save(user);

      // Devolver usuario sin la contraseña
      const { password, ...result } = updatedUser;
      const isInstructor = updatedUser.userType === 2;
      return { ...result, isInstructor } as UserResponseDto;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el usuario');
    }
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }

  async getProfile(id: number): Promise<UserResponseDto> {
    const user = await this.findById(id);
    const { password, ...result } = user;
    const isInstructor = user.userType === 2;
    return { ...result, isInstructor } as UserResponseDto;
  }

  // Método para cambiar la contraseña
  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findById(id);

    // Verificar la contraseña actual
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new ConflictException('La contraseña actual es incorrecta');
    }

    // Actualizar la contraseña
    user.password = newPassword;
    await this.usersRepository.save(user);
  }

  /**
   * Verifica si el usuario tiene el rol o tipo especificado
   * @param userId ID del usuario a verificar
   * @param requiredType Tipo de usuario requerido o array de tipos permitidos
   * @returns true si el usuario tiene el tipo requerido, false en caso contrario
   * @throws NotFoundException si el usuario no existe
   * @throws ForbiddenException si el usuario no tiene el tipo requerido (cuando throwError=true)
   */
  async checkUserType(
    userId: number,
    requiredType: UserType | UserType[],
    throwError: boolean = false,
  ): Promise<boolean> {
    const user = await this.findById(userId);

    // Verificar directamente usando el método de la entidad
    const hasRequiredType = user.hasRole(requiredType);

    if (!hasRequiredType && throwError) {
      // Obtener los nombres de los roles para el mensaje de error
      const requiredTypes = Array.isArray(requiredType)
        ? requiredType
        : [requiredType];
      const roleNames = requiredTypes.map(
        (type) => UserTypeNames[type] || `Unknown role (${type})`,
      );

      throw new ConflictException(
        `Access denied. Required role: ${roleNames.join(' or ')}.`,
      );
    }

    return hasRequiredType;
  }

  /**
   * Obtiene el nombre del rol de usuario a partir de su tipo
   * @param userType Tipo de usuario
   * @returns Nombre del rol de usuario
   */
  getUserTypeName(userType: UserType): string {
    return UserTypeNames[userType] || 'Unknown';
  }

  /**
   * Verifica si el usuario es un administrador
   * @param userId ID del usuario a verificar
   * @param throwError Si debe lanzar excepción cuando no tiene el rol
   */
  async isAdmin(userId: number, throwError: boolean = false): Promise<boolean> {
    return this.checkUserType(userId, UserType.ADMIN, throwError);
  }

  /**
   * Verifica si el usuario es un cliente
   * @param userId ID del usuario a verificar
   * @param throwError Si debe lanzar excepción cuando no tiene el rol
   */
  async isClient(
    userId: number,
    throwError: boolean = false,
  ): Promise<boolean> {
    return this.checkUserType(userId, UserType.RECEPCION, throwError);
  }

  /**
   * Verifica si el usuario es un entrenador
   * @param userId ID del usuario a verificar
   * @param throwError Si debe lanzar excepción cuando no tiene el rol
   */
  async isTrainer(
    userId: number,
    throwError: boolean = false,
  ): Promise<boolean> {
    return this.checkUserType(userId, UserType.TRAINER, throwError);
  }
  async findLatestByType(
    userType: number,
    limit: number,
  ): Promise<UserResponseDto[]> {
    console.log(
      `findLatestByType called with userType: ${userType}, limit: ${limit}`,
    );
    const users = await this.usersRepository.find({
      where: { userType }, // Using the correct property name 'userType'
      order: { createdAt: 'DESC' }, // Order by creation date descending
      take: limit, // Limit the number of results
    });

    console.log(`findLatestByType found ${users.length} users.`);
    return users.map((user) => {
      const { password, ...result } = user;
      const isInstructor = user.userType === 2;
      return { ...result, isInstructor } as UserResponseDto;
    });
  }
}

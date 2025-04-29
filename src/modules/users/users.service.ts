import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/users.entity';
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
      return result as UserResponseDto;
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
      return result as UserResponseDto;
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
      return result as UserResponseDto;
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
    return result as UserResponseDto;
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
}

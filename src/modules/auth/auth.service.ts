import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './DTO/auth.dto';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from './entities/token.entity';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // Crear hash de la contraseña
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    try {
      const user = await this.usersService.create({
        email,
        password: hashedPassword,
        name,
      });

      // Generar tokens
      const tokens = await this.generateTokens(user.id, user.email);

      // Guardar refresh token en la base de datos
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        ...tokens,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al registrar el usuario');
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar usuario por email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Guardar refresh token en la base de datos
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      // Verificar refresh token
      const payload = await this.verifyRefreshToken(refreshToken);
      const userId = payload.sub;

      // Buscar token en la base de datos
      const storedToken = await this.tokenRepository.findOne({
        where: { userId, token: refreshToken, revoked: false },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Token inválido');
      }

      // Generar nuevos tokens
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const tokens = await this.generateTokens(user.id, user.email);

      // Revocar token anterior
      await this.tokenRepository.update(storedToken.id, { revoked: true });

      // Guardar nuevo refresh token
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async logout(userId: number) {
    // Revocar todos los refresh tokens del usuario
    await this.tokenRepository.update(
      { userId, revoked: false },
      { revoked: true },
    );

    return { message: 'Sesión cerrada exitosamente' };
  }

  async getProfile(user: any) {
    const userData = await this.usersService.findById(user.sub);
    if (!userData) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
    };
  }

  private async generateTokens(userId: number, email: string) {
    const jwtid = uuidv4();
    const tokenVersion = uuidv4();

    // Payload para el token de acceso
    const accessPayload = {
      sub: userId,
      email,
      jti: jwtid,
    };

    // Payload para el refresh token
    const refreshPayload = {
      sub: userId,
      email,
      jti: uuidv4(),
      version: tokenVersion,
    };

    // Generar tokens
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn:
          this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m',
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn:
          this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async storeRefreshToken(userId: number, token: string) {
    // Crear hash del token para almacenamiento seguro
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Guardar token en la base de datos
    await this.tokenRepository.save({
      userId,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      revoked: false,
    });
  }

  private async verifyRefreshToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}

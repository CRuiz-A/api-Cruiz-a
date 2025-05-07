import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Módulos personalizados
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClassesModule } from './modules/classes/classes.module';

// Entidades que deben encontrarse en las rutas correctas
import { Token } from './modules/auth/entities/token.entity';
import { User } from './modules/users/entities/users.entity';
// No es necesario importar aquí Class y ClassStudent si ya se manejan en ClassesModule

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Conexión a PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'clases_baile_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'], // Esta línea encuentra todas las entidades automáticamente
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') !== 'production',
        ssl: configService.get('DB_SSL') === 'true'
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),

    // Módulos funcionales
    AuthModule,
    UsersModule,
    ClassesModule, // Módulo que maneja clases y estudiantes
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

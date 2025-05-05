import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { UsersService } from './modules/users/users.service';
import { CreateUserDto } from './modules/users/DTO/users.dto';

async function addTestUser(app: INestApplication) {
  const usersService = app.get(UsersService);

  const testUser: CreateUserDto = {
    email: 'testuser@example.com',
    password: 'Test@1234',
    name: 'Test User',
    birthdate: '1990-01-01',
    gender: 'male',
    userType: 1,
  };

  try {
    const existingUser = await usersService.findByEmail(testUser.email);
    if (!existingUser) {
      await usersService.create(testUser);
      console.log('Test user added successfully.');
    } else {
      console.log('Test user already exists.');
    }
  } catch (error) {
    console.error('Error adding test user:', error);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración global de pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configuración de CORS
  app.enableCors();

  // Configuración de prefijo global para la API (opcional)
  app.setGlobalPrefix('api');

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Documentación para el Back-End de la Aplicación "Pal´ alma"')
    .setDescription('API Documentation for your application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 3001);
  console.log('El API escucha por el puerto: ', process.env.PORT || 3001);

  // Add test user
  await addTestUser(app);
}
bootstrap();

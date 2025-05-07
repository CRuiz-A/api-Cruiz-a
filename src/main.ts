import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, INestApplication, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { UsersService } from './modules/users/users.service';
import { CreateUserDto } from './modules/users/DTO/users.dto';
import { ClassesService } from './modules/classes/classes.service';
import { Repository } from 'typeorm';
import { ClassStudent } from './modules/classes/entities/class-student.entity';
import { Class } from './modules/classes/entities/class.entity';
import { User } from './modules/users/entities/users.entity';

async function addTestUser(app: INestApplication) {
  const usersService = app.get(UsersService);

  const testUser: CreateUserDto = {
    email: 'testuser@example.com',
    password: 'Test@123445',
    name: 'Test user',
    birthdate: '1990-01-01',
    gender: 'male',
    userType: 1, // Assuming 2 is the user type for instructors
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

async function addTestInstructorAndClass(app: INestApplication) {
  const usersService = app.get(UsersService);
  const classesService = app.get(ClassesService);

  const testInstructor: CreateUserDto = {
    email: 'testinstructor@example.com',
    password: 'Instructor@1234',
    name: 'Test Instructor',
    birthdate: '1985-01-01',
    gender: 'male',
    userType: 2,
  };

  try {
    const existingInstructor = await usersService.findByEmail(testInstructor.email);
    let instructor;
    if (existingInstructor) {
      instructor = existingInstructor;
      console.log('Test instructor already exists.');
    } else {
      try {
      instructor = await usersService.create(testInstructor);
      console.log('Test instructor added successfully.');
    } catch (error) {
      // Catch ConflictException which is thrown by UsersService.create on duplicate key error
      if (error instanceof ConflictException) {
        console.log('Test instructor already exists.');
        instructor = await usersService.findByEmail(testInstructor.email); // Fetch the existing user
      } else {
        throw error; // Re-throw other errors
        }
      }
    }

    // Add a check to ensure instructor is not null
    if (!instructor) {
      console.error('Error: Could not retrieve test instructor after creation attempt.');
      return; // Exit the function if instructor is null
    }

    const testClass = {
      nombreClase: 'Test Class',
      fecha: '2025-05-10',
      horaInicio: '10:00',
      horaFin: '12:00',
      instructorId: instructor.id,
      studentIds: [], // Add student IDs if needed
    };

    // Check if a class with this instructor already exists (optional, depending on desired behavior)
    // const existingClass = await classesService.findClassByInstructorAndName(instructor.id, testClass.nombreClase);
    // if (!existingClass) {
    const createdClass = await classesService.create(testClass);
    console.log('Test class created successfully:', createdClass);
    // } else {
    //   console.log('Test class already exists for this instructor.');
    // }

  } catch (error) {
    console.error('Error adding test instructor or class:', error);
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

  // Add test instructor and class
  await addTestInstructorAndClass(app);

  // Add test user to test class
  await addTestUserToTestClass(app);

  // Show test user's classes
  await showTestUserClasses(app);

  // Add a second test class and enroll test user
  await addSecondTestClassAndEnrollUser(app);

  // Show test user's classes again to see the new class
  await showTestUserClasses(app);

  // Test getClassesByDate service
  const classesService = app.get(ClassesService);
  const testDateString = '2025-05-10';
  const testTimezone = 'America/Bogota';

  console.log(`\nFetching classes for date: ${testDateString} in timezone: ${testTimezone}`);
  const classesOnDate = await classesService.getClassesByDate(testDateString, testTimezone);

  if (classesOnDate.length > 0) {
    console.log(`Found ${classesOnDate.length} classes on ${testDateString}:`);
    classesOnDate.forEach(classInfo => {
      if (classInfo.nombreClase) { // Only log if nombreClase is not null
        console.log(`- Class: ${classInfo.nombreClase}, Instructor: ${classInfo.instructor?.name || 'N/A'}, Time: ${classInfo.horaInicio}-${classInfo.horaFin}`);
      }
    });
  } else {
    console.log(`No classes found on ${testDateString}.`);
  }
}
bootstrap();

async function addSecondTestClassAndEnrollUser(app: INestApplication) {
  const usersService = app.get(UsersService);
  const classesService = app.get(ClassesService);
  const classRepo = app.get<Repository<Class>>('ClassRepository'); // Assuming 'ClassRepository' is the token
  const classStudentRepo = app.get<Repository<ClassStudent>>('ClassStudentRepository'); // Assuming 'ClassStudentRepository' is the token

  try {
    // Retrieve the test instructor
    const testInstructor = await usersService.findByEmail('testinstructor@example.com');
    if (!testInstructor) {
      console.error('Error adding second test class: Test instructor not found.');
      return;
    }

    // Define the second test class
    const secondTestClassDetails = {
      nombreClase: 'Another Test Class',
      fecha: '2025-05-11', // Different date
      horaInicio: '14:00', // Different time
      horaFin: '16:00',
      instructorId: testInstructor.id,
      studentIds: [],
    };

    // Check if the second class already exists
    const existingSecondClass = await classRepo.findOne({ where: { nombreClase: secondTestClassDetails.nombreClase } });
    let secondTestClass;

    if (existingSecondClass) {
      secondTestClass = existingSecondClass;
      console.log('Second test class already exists.');
    } else {
      // Create the second test class
      secondTestClass = await classesService.create(secondTestClassDetails);
      console.log('Second test class created successfully:', secondTestClass);
    }

    // Retrieve the test user
    const testUser = await usersService.findByEmail('testuser@example.com');
    if (!testUser) {
      console.error('Error enrolling test user in second class: Test user not found.');
      return;
    }

    // Check if the student is already in the second class
    const existingClassStudent = await classStudentRepo.findOne({
      where: {
        class: { id: secondTestClass.id },
        student: { id: testUser.id },
      },
    });

    if (existingClassStudent) {
      console.log('Test user is already in the second test class.');
      return;
    }

    // Enroll the test user in the second class
    const classStudent = classStudentRepo.create({
      class: secondTestClass,
      student: testUser,
    });

    await classStudentRepo.save(classStudent);
    console.log('Test user added to second test class successfully.');

  } catch (error) {
    console.error('Error adding second test class or enrolling user:', error);
  }
}

async function showTestUserClasses(app: INestApplication) {
  const classesService = app.get(ClassesService);

  try {
    console.log('Fetching classes for test user...');
    const userClasses = await classesService.getClassesByStudentEmail('testuser@example.com');

    if (userClasses.length > 0) {
      console.log('Test user is enrolled in the following classes:');
      userClasses.forEach(classInfo => {
        console.log(`- Class: ${classInfo.nombreClase}, Instructor: ${classInfo.instructor.name}, Date: ${classInfo.fecha}, Time: ${classInfo.horaInicio}-${classInfo.horaFin}`);
      });
    } else {
      console.log('Test user is not enrolled in any classes.');
    }
  } catch (error) {
    console.error('Error fetching classes for test user:', error);
  }
}

async function addTestUserToTestClass(app: INestApplication) {
  const usersService = app.get(UsersService);
  const classRepo = app.get<Repository<Class>>('ClassRepository'); // Assuming 'ClassRepository' is the token
  const classStudentRepo = app.get<Repository<ClassStudent>>('ClassStudentRepository'); // Assuming 'ClassStudentRepository' is the token

  try {
    const testUser = await usersService.findByEmail('testuser@example.com');
    const testClass = await classRepo.findOne({ where: { nombreClase: 'Test Class' } });

    if (!testUser) {
      console.error('Error adding test user to test class: Test user not found.');
      return;
    }

    if (!testClass) {
      console.error('Error adding test user to test class: Test class not found.');
      return;
    }

    // Check if the student is already in the class
    const existingClassStudent = await classStudentRepo.findOne({
      where: {
        class: { id: testClass.id },
        student: { id: testUser.id },
      },
    });

    if (existingClassStudent) {
      console.log('Test user is already in the test class.');
      return;
    }

    const classStudent = classStudentRepo.create({
      class: testClass,
      student: testUser,
    });

    await classStudentRepo.save(classStudent);
    console.log('Test user added to test class successfully.');

  } catch (error) {
    console.error('Error adding test user to test class:', error);
  }
}

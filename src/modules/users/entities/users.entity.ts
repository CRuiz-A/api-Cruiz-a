import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import { Class } from '../../classes/entities/class.entity';
import { ClassStudent } from '../../classes/entities/class-student.entity';
import * as bcrypt from 'bcrypt';

export enum UserType {
  ADMIN = 0,
  INSTRUCTOR = 1,
  RECEPCION = 2,
  TRAINER = 3,
}

export const UserTypeNames = {
  [UserType.ADMIN]: 'Administrator',
  [UserType.INSTRUCTOR]: 'Instructor',
  [UserType.RECEPCION]: 'RECEPCION',
  [UserType.TRAINER]: 'Trainer',
};

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  birthdate: string;

  @Column()
  gender: string;

  @Column()
  userType: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Class, cls => cls.instructor)
  classes: Class[];

  @OneToMany(() => ClassStudent, cs => cs.student)
  classStudents: ClassStudent[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // Solo hashear la contraseña si ha sido modificada
    if (
      this.password &&
      this.password.trim() &&
      !this.password.startsWith('$2b$')
    ) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  // Método para comparar contraseñas
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Método para obtener el nombre del rol
  getRoleName(): string {
    return UserTypeNames[this.userType] || 'Unknown';
  }

  // Helpers para verificar tipos de usuario
  isAdmin(): boolean {
    return this.userType === UserType.ADMIN;
  }

  isRECEPCION(): boolean {
    return this.userType === UserType.RECEPCION;
  }

  isTrainer(): boolean {
    return this.userType === UserType.TRAINER;
  }

  isRegularUser(): boolean {
    return this.userType === UserType.INSTRUCTOR;
  }

  // Método para verificar si tiene uno de los roles especificados
  hasRole(roles: UserType | UserType[]): boolean {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(this.userType);
  }
}

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
}

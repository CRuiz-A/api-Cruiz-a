import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Class } from './class.entity';
import { User } from '../../users/entities/users.entity';

@Entity('class_students')
export class ClassStudent {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Class, cls => cls.students)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @ManyToOne(() => User, user => user.classStudents)
  @JoinColumn({ name: 'student_id' })
  student: User;
}

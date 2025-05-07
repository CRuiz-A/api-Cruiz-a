import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { ClassStudent } from './class-student.entity';

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nombre_clase', nullable: true })
  nombreClase: string;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'time', nullable: true })
  horaInicio: string;

  @Column({ type: 'time', nullable: true })
  horaFin: string;

  @ManyToOne(() => User, user => user.classes)
  @JoinColumn({ name: 'instructor_id' })
  instructor: User;

  @OneToMany(() => ClassStudent, cs => cs.class)
  students: ClassStudent[];
}

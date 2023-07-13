import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Professional } from './professional.entity';

@Entity()
export class Pro_skills {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @ManyToOne(() => Professional, {
    onDelete: 'CASCADE',
  })
  professional: Professional;

  @Column({
    nullable: false,
  })
  skill: string;
}

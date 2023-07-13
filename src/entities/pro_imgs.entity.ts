import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Professional } from './professional.entity';

@Entity()
export class Pro_imgs {
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
  img: string;
}

import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Professional {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

  @OneToOne((type) => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @Column({
    nullable: false,
  })
  profession: string;

  @Column('decimal', {
    scale: 1,
    nullable: false,
  })
  rating: number;

  @Column({
    nullable: false,
  })
  description: string;
}

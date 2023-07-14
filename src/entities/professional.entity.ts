import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Pro_skills } from './pro_skills.entity';
import { Pro_imgs } from './pro_imgs.entity';

@Entity()
export class Professional {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  id: number;

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
  @Column()
  user_id: number
  
  @OneToOne(() => User, (user) => user.professional, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @OneToMany(() => Pro_skills, (pro_skills) => pro_skills.professional)
  pro_skills: Pro_skills[];

  @OneToMany(() => Pro_imgs, (pro_imgs) => pro_imgs.professional)
  pro_imgs: Pro_imgs[];
}

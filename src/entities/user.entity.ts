import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ROLES {
  PRO = 'pro',
  CUSTOMER = 'customer',
}
@Entity()
export class User {
  @PrimaryGeneratedColumn({
    type: 'bigint',
  })
  user_id: number;

  @Column({
    nullable: false,
  })
  fullname: string;

  @Column({
    unique: true,
    nullable: false,
  })
  phoneNumber: string;

  @Column({
    nullable: false,
  })
  profile_img: string;

  @Column({
    nullable: true,
  })
  password: string;

  @Column({
    type: 'enum',
    enum: ROLES,
    nullable: false,
  })
  role: string;

  @Column({
    nullable: false,
  })
  is_phone_number_verify: boolean;

  @Column({
    nullable: true,
  })
  code_sms: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  code_sms_timer: Date;

  @Column({
    nullable: true,
  })
  refresh_token: string;
}

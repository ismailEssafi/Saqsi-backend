import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Crypto } from '../utils/crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    private crypto: Crypto,
    private configService: ConfigService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}
  create(createUserDto: CreateUserDto) {
    const createUser = {
      fullname: createUserDto.fullname,
      phoneNumer: createUserDto.phoneNumber,
      password: this.crypto.hash(createUserDto.password),
      role: 'pro',
      is_phone_number_verify: false,
      code_sms: String(Math.floor(1000 + Math.random() * 9000)),
      code_sms_timer: new Date(
        Date.now() + this.configService.get('SMS_TIMER_MINUTE') * 60 * 1000,
      )
        .toISOString()
        .replace('T', ' ')
        .replace('Z', ''),
    };
    const newUser = this.userRepository.create(createUser);
    return this.userRepository.save(newUser);
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  // smsVerification(phoneNumber: string) {
  //   return `This action removes a #${id} user`;
  // }
}

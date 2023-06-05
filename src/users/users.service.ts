import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const salt = await bcrypt.genSalt();
    const createUser = {
      fullname: createUserDto.fullname,
      phoneNumber: `+212${createUserDto.phoneNumber.slice(1)}`,
      password: await bcrypt.hash(createUserDto.password, salt),
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
    return `This action s a #${id} user`;
  }

  async remove(user_id: number) {
    await this.userRepository.delete({ user_id: user_id });
  }

  async otpVerification(userInfo: any) {
    const user = await this.userRepository.findOneBy({
      user_id: userInfo.userId,
    });
    console.log(user);
    if (user.code_sms != userInfo.codeOTP) {
      return 'invalid sms code';
    }
    const smsDatetime = moment(user.code_sms_timer).add(1, 'hour');
    const datetimeNow = moment();
    if (datetimeNow.isAfter(smsDatetime)) {
      return 'the sms otp has expired';
    }
    return 'all good';
  }
}

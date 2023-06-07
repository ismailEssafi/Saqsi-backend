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

  async otpVerification(otpInfo: any) {
    const user = await this.userRepository.findOneBy({
      user_id: otpInfo.userId,
    });
    if (!user) {
      throw new Error('user_not_found');
    }
    if (user.code_sms != otpInfo.codeOTP) {
      return 'invalid_otp';
    }
    const smsDatetime = moment(user.code_sms_timer).add(1, 'hour');
    const datetimeNow = moment();
    if (datetimeNow.isAfter(smsDatetime)) {
      return 'otp_expired';
    }
    await this.userRepository.update(
      { user_id: otpInfo.userId },
      { is_phone_number_verify: true },
    );
    return 'phoneNumber_is_verify';
  }

  async renewUserOtpInfo(userId: string) {
    await this.userRepository.update(
      { user_id: +userId },
      {
        code_sms: String(Math.floor(1000 + Math.random() * 9000)),
        code_sms_timer: new Date(
          Date.now() + this.configService.get('SMS_TIMER_MINUTE') * 60 * 1000,
        )
          .toISOString()
          .replace('T', ' ')
          .replace('Z', ''),
      },
    );

    const result = await this.userRepository.findOneBy({
      user_id: +userId,
    });
    if (!result) {
      throw new Error('user_not_found');
    }
    return result;
  }
}

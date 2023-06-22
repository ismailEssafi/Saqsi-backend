import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
// import { LoginUserDto } from './dto/login-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SmsHelper } from '../utils/smsHelper';

@Injectable()
export class UsersService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
    private smsHelper: SmsHelper,
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

  async validateCredentials(phoneNumber: string, password: string) {
    const user = await this.userRepository.findOneBy({
      phoneNumber: `+212${phoneNumber.slice(1)}`,
    });
    if (!user) {
      return null;
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return null;
    }
    return user;
  }

  async login(user: any) {
    const payload = { user_id: user.user_id, phoneNumber: user.phoneNumber };
    const access_token = await this.jwtService.sign(payload);
    const refresh_token = await this.jwtService.sign(payload, {
      expiresIn: '60s',
    });
    await this.userRepository.update(
      { user_id: user.user_id },
      { refresh_token: refresh_token },
    );
    return {
      user: user,
      access_token: access_token,
      refresh_token: refresh_token,
    };
  }
  async renewAccessToken(refresh_token: string): Promise<string> {
    let payload;
    try {
      payload = this.jwtService.verify(refresh_token);
    } catch (error) {
      throw new Error('invalid_refresh_token');
    }
    const access_token = await this.jwtService.sign({
      user_id: payload.user_id,
      phoneNumber: payload.phoneNumber,
    });
    return access_token;
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
    return user;
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

  async forgotPassword(phoneNumber: string) {
    const user = await this.userRepository.findOneBy({
      phoneNumber: `+212${phoneNumber.slice(1)}`,
    });
    if (!user) {
      throw new Error('user_not_found');
    }
    const result = await this.renewUserOtpInfo(String(user.user_id));
    await this.smsHelper.sendOTP(
      result.phoneNumber,
      result.code_sms,
      async (err) => {
        if (err) {
          throw new Error('faild_to_send_otp');
        } else {
          return result.user_id;
        }
      },
    );
    return result.user_id;
  }
}

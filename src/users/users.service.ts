import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
// import { LoginUserDto } from './dto/login-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Professional } from '../entities/professional.entity';
import { Pro_imgs } from '../entities/pro_imgs.entity';
import { Pro_skills } from '../entities/pro_skills.entity';
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
    @InjectRepository(Professional)
    private readonly professionalRepository: Repository<Professional>,
    @InjectRepository(Pro_imgs)
    private readonly proImgsRepository: Repository<Pro_imgs>,
    @InjectRepository(Pro_skills)
    private readonly proSkillsRepository: Repository<Pro_skills>,
    private jwtService: JwtService,
    private smsHelper: SmsHelper,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const salt = await bcrypt.genSalt();
    const createUser = {
      fullname: createUserDto.fullname,
      phoneNumber: `+212${createUserDto.phoneNumber.slice(1)}`,
      profile_img:
        'https://static.vecteezy.com/system/resources/previews/015/272/283/original/construction-worker-icon-person-profile-avatar-with-hard-helmet-and-jacket-builder-man-in-a-helmet-icon-illustration-vector.jpg',
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
    const user = await this.userRepository.save(newUser);
    const createPro = {
      user: user,
      user_id: Number(user.user_id),
      profession: 'add profession',
      rating: 4,
      description: 'add description here :>',
    };
    const newPro = this.professionalRepository.create(createPro);
    const pro = await this.professionalRepository.save(newPro);
    const createProSkills = [
      {
        professional: pro,
        skill: 'skill1',
      },
      {
        professional: pro,
        skill: 'skill2',
      },
      {
        professional: pro,
        skill: 'skill3',
      },
      {
        professional: pro,
        skill: 'skill4',
      },
      {
        professional: pro,
        skill: 'skill5',
      },
      {
        professional: pro,
        skill: 'skill6',
      },
    ];
    const newProSkills = this.proSkillsRepository.create(createProSkills);
    await this.proSkillsRepository.save(newProSkills);
    const createProImgs = [
      {
        professional: pro,
        img: 'https://endlessicons.com/wp-content/uploads/2012/11/image-holder-icon-614x460.png',
      },
      {
        professional: pro,
        img: 'https://endlessicons.com/wp-content/uploads/2012/11/image-holder-icon-614x460.png',
      },
      {
        professional: pro,
        img: 'https://endlessicons.com/wp-content/uploads/2012/11/image-holder-icon-614x460.png',
      },
      {
        professional: pro,
        img: 'https://endlessicons.com/wp-content/uploads/2012/11/image-holder-icon-614x460.png',
      },
    ];
    const newProImgs = this.proImgsRepository.create(createProImgs);
    await this.proImgsRepository.save(newProImgs);
    return user;
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

  async getProAllInfo(userId: number) {
    const result = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.professional', 'professional')
      .leftJoinAndSelect('professional.pro_skills', 'pro_skills')
      .leftJoinAndSelect('professional.pro_imgs', 'pro_imgs')
      .where('user.user_id = :user_id', { user_id: userId })
      .getOne();
    if (!result) {
      throw new Error('user_not_found');
    }
    return result;
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

  async resetPassword(resetPasswordInfo: any) {
    const salt = await bcrypt.genSalt();
    const user = await this.userRepository.findOneBy({
      user_id: resetPasswordInfo.userId,
      code_sms: resetPasswordInfo.codeOTP,
    });
    if (!user) {
      throw new Error('bad_request');
    }
    await this.userRepository.update(
      { user_id: +user.user_id },
      {
        password: await bcrypt.hash(resetPasswordInfo.password, salt),
      },
    );
    const payload = { user_id: user.user_id, phoneNumber: user.phoneNumber };
    const access_token = await this.jwtService.sign(payload);
    const refresh_token = await this.jwtService.sign(payload, {
      expiresIn: '60s',
    });
    return { access_token, refresh_token };
  }

  async editProfileImg(userId: string, imgUrl: string) {
    await this.userRepository.update(
      { user_id: Number(userId) },
      { profile_img: imgUrl },
    );
  }

  async editProImgs(userId: string, listImgInfo: any[]) {
    const pro = await this.professionalRepository.findOneBy({
      user_id: Number(userId),
    });
    const createProImgs: any[] = [];
    for (const imgInfo of listImgInfo) {
      createProImgs.push({
        professional: pro,
        img: imgInfo.Location,
      });
    }
    const newProImgs = this.proImgsRepository.create(createProImgs);
    await this.proImgsRepository.save(newProImgs);
  }

  async deleteImgs(userId: string, deleteImgs: number[]) {
    await this.proImgsRepository.delete(deleteImgs);
  }
}

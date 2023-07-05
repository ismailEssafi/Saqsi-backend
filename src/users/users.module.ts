import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local-strategy';
import { JwtStrategy } from './strategies/jwt-strategy';
import { User } from '../entities/user.entity';
import { Professional } from '../entities/professional.entity';
import { Pro_skills } from '../entities/pro_skills.entity';
import { Pro_imgs } from '../entities/pro_imgs.entity';
import { SmsHelper } from '../utils/smsHelper';
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: `${process.env.JWT_SECRET}`,
      signOptions: { expiresIn: '30s' },
    }),
    TypeOrmModule.forFeature([User, Professional, Pro_skills, Pro_imgs]),
  ],
  controllers: [UsersController],
  providers: [UsersService, SmsHelper, LocalStrategy, JwtStrategy],
})
export class UsersModule {}

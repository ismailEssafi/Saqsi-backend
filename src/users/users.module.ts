import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local-strategy';
import { User } from './entities/user.entity';
import { SmsHelper } from '../utils/smsHelper';
import { ConfigService } from '@nestjs/config';
const configService = new ConfigService();

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register({
      secret: 'test',
      signOptions: { expiresIn: '300s' },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, SmsHelper, LocalStrategy],
})
export class UsersModule {}

import {
  Controller,
  Res,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  UsePipes,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SmsHelper } from '../utils/smsHelper';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private smsHelper: SmsHelper,
  ) {}

  @Post()
  @UsePipes(ValidationPipe)
  async create(@Res() response, @Body() createUserDto: CreateUserDto) {
    let result;
    try {
      result = await this.usersService.create(createUserDto);
    } catch (error) {
      if (error.code == '23505') {
        return response.status(HttpStatus.BAD_REQUEST).json({
          message: 'user phone number already exist',
        });
      }
    }
    if (result) {
      await this.smsHelper.sendOTP(
        result.phoneNumber,
        result.code_sms,
        async (err) => {
          if (err) {
            await this.usersService.remove(result.user_id);
            console.log(
              'ERROR: in UsersController-->create() faild to send sms otp message',
            );
            return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              message: 'INTERNAL_SERVER_ERROR',
            });
          } else {
            return response.status(HttpStatus.CREATED).json({
              message: 'user was created',
              userId: result.user_id,
            });
          }
        },
      );
    } else {
      console.log(
        'ERROR: in UsersController-->create() faild to register a user',
      );
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('otpVerification')
  async otpVerification(@Res() response, @Body() otpInfo: any) {
    let result: string;
    try {
      result = await this.usersService.otpVerification(otpInfo);
    } catch (error) {
      if (error == 'Error: user_not_found') {
        return response.status(HttpStatus.BAD_REQUEST).json({
          message: 'userId dont exist',
        });
      }
      console.log('ERROR: in UsersController-->otpVerification()');
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
    }
    if (result == 'invalid_otp') {
      return response.status(HttpStatus.BAD_REQUEST).json({
        message: 'invalid otp',
      });
    }
    if (result == 'otp_expired') {
      return response.status(HttpStatus.BAD_REQUEST).json({
        message: 'otp expired',
      });
    }
    if (result == 'phoneNumber_is_verify') {
      return response.status(HttpStatus.ACCEPTED).json({
        message: 'phoneNumber_is_verify',
      });
    }
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}

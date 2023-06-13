import {
  Controller,
  Res,
  Req,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  UsePipes,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SmsHelper } from '../utils/smsHelper';
import { AuthGuard } from '@nestjs/passport';
// import { LocalAuthGuard } from './guards/local-auth.guard';
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
          message: 'user_phone_number_already_exist',
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
              message: 'user_was_created',
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

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Req() request, @Res() response) {
    const result = await this.usersService.login(request.user);
    return response.status(HttpStatus.ACCEPTED).json({
      access_token: result.access_token,
    });
  }

  @Post('otpVerification')
  async otpVerification(@Res() response, @Body() otpInfo: any) {
    let result: string;
    try {
      result = await this.usersService.otpVerification(otpInfo);
    } catch (error) {
      if (error == 'Error: user_not_found') {
        return response.status(HttpStatus.BAD_REQUEST).json({
          message: 'userId_dont_exist',
        });
      }
      console.log('ERROR: in UsersController-->otpVerification()');
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
    }
    if (result == 'invalid_otp') {
      return response.status(HttpStatus.BAD_REQUEST).json({
        message: result,
      });
    }
    if (result == 'otp_expired') {
      let updatedUser: any;
      try {
        updatedUser = await this.usersService.renewUserOtpInfo(otpInfo.userId);
      } catch (error) {
        console.log('ERROR: in UsersController-->otpVerification()');
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
      }
      await this.smsHelper.sendOTP(
        updatedUser.phoneNumber,
        updatedUser.code_sms,
        async (err) => {
          if (err) {
            console.log('ERROR: in UsersController-->otpVerification()');
            return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
          } else {
            return response.status(HttpStatus.BAD_REQUEST).json({
              message: result,
            });
          }
        },
      );
    }
    if (result == 'phoneNumber_is_verify') {
      return response.status(HttpStatus.ACCEPTED).json({
        message: result,
      });
    }
  }

  @Post('resendOTP/:userId')
  async resendOTP(@Res() response, @Param('userId') userId: string) {
    let updatedUser: any;
    try {
      updatedUser = await this.usersService.renewUserOtpInfo(userId);
    } catch (error) {
      if (error == 'Error: user_not_found') {
        return response.status(HttpStatus.BAD_REQUEST).json({
          message: 'userId_dont_exist',
        });
      }
      console.log('ERROR: in UsersController-->otpVerification()');
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
    }
    await this.smsHelper.sendOTP(
      updatedUser.phoneNumber,
      updatedUser.code_sms,
      async (err) => {
        if (err) {
          console.log(
            'ERROR: in UsersController-->otpVerification() faild to send sms otp message',
          );
          return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
        } else {
          return response.status(HttpStatus.OK).json({
            message: 'otp_resend_success',
          });
        }
      },
    );
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

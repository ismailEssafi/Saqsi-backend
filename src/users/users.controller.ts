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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SmsHelper } from '../utils/smsHelper';
import { JwtStrategy } from './strategies/jwt-strategy';
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
      console.log(
        'ERROR: in UsersController-->create() faild to register a user',
      );
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
    }

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
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Req() request, @Res() response) {
    let result;
    if (request.user.is_phone_number_verify == false) {
      return response.status(HttpStatus.NOT_ACCEPTABLE).json({
        userId: request.user.user_id,
      });
    }
    try {
      result = await this.usersService.login(request.user);
    } catch (err) {
      console.log('ERROR: in UsersController-->login()');
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR);
    }
    response.cookie('access_token', result.access_token, {
      // secure: false, //secure == trensfer cookies in https or not
      // sameSite: '',lax
      origin: 'http://localhost:4200',
      httpOnly: true,
    });
    response.cookie('refresh_token', result.refresh_token, {
      // secure: false,
      // sameSite: 'lax',
      origin: 'http://localhost:4200',
      httpOnly: true,
    });
    return response.status(HttpStatus.ACCEPTED).json({
      user: request.user,
    });
  }

  @Post('otpVerification')
  async otpVerification(@Res() response, @Body() otpInfo: any) {
    let result;
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

    return response.status(HttpStatus.ACCEPTED).json({
      userId: result.user_id,
      phoneNumber: result.phoneNumber,
    });
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

  @Get('renewAccessToken')
  async renewAccessToken(@Req() request, @Res() response) {
    let accessToken;
    try {
      accessToken = await this.usersService.renewAccessToken(
        request.cookies.refresh_token,
      );
    } catch (error) {
      if (error == 'Error: invalid_refresh_token') {
        throw new UnauthorizedException();
      }
      console.log('ERROR: in UsersController-->renewAccessToken()');
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
    }
    response.cookie('access_token', accessToken, {
      secure: false, //secure == trensfer cookies in https or not
      // sameSite: 'lax',
      origin: 'http://localhost:4200',
      httpOnly: true,
    });
    return response.status(HttpStatus.ACCEPTED).json();
  }

  @Post('forgotPassword')
  async forgotPassword(
    @Body('phoneNumber') phoneNumber: string,
    @Res() response,
  ) {
    let result;
    try {
      result = await this.usersService.forgotPassword(phoneNumber);
    } catch (error) {
      if (error == 'Error: user_not_found') {
        return response.status(HttpStatus.BAD_REQUEST).json();
      }
      if (error == 'Error: faild_to_send_otp') {
        console.log(
          'ERROR: in UsersController-->forgotPassword() faild to send sms otp message',
        );
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
      }
      console.log('ERROR: in UsersController-->forgotPassword()');
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
    }
    return response.status(HttpStatus.ACCEPTED).json({
      userId: result,
    });
  }

  @UsePipes(ValidationPipe)
  @Post('resetPassword')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res() response,
  ) {
    let result;
    try {
      result = await this.usersService.resetPassword(resetPasswordDto);
    } catch (error) {
      if (error == 'Error: bad_request') {
        return response.status(HttpStatus.BAD_REQUEST).json();
      }
      console.log('ERROR: in UsersController-->forgotPassword()');
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
    }
    response.cookie('access_token', result.access_token, {
      // secure: false, //secure == trensfer cookies in https or not
      // sameSite: '',lax
      origin: 'http://localhost:4200',
      httpOnly: true,
    });
    response.cookie('refresh_token', result.refresh_token, {
      // secure: false,
      // sameSite: 'lax',
      origin: 'http://localhost:4200',
      httpOnly: true,
    });
    return response.status(HttpStatus.ACCEPTED).json();
  }
  @UseGuards(JwtStrategy)
  @Post('test')
  findAll(@Req() request, @Res() response) {
    return response
      .status(HttpStatus.ACCEPTED)
      .json({ mesg: 'work just fine' });
  }

  @Get('proInfo/:userId')
  async getProAllInfo(@Param('userId') userId: string, @Res() response) {
    let result;
    try {
      result = await this.usersService.getProAllInfo(Number(userId));
    } catch (error) {
      if (error == 'Error: user_not_found') {
        return response.status(HttpStatus.BAD_REQUEST).json();
      }
      console.log('ERROR: in UsersController-->getProAllInfo()');
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
    }
    return response.status(HttpStatus.ACCEPTED).json(result);
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

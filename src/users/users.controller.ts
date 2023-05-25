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
  HttpException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SmsHelper } from '../utils/smsHelper';
import { error } from 'console';

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
      await this.smsHelper.sendSMSMessageVerifyPhoneNumberCode(
        result.phoneNumber,
        result.code_sms,
        async (err, data) => {
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

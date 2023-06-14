import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
// import { LoginUserDto } from '../dto/login-user.dto';
import { UsersService } from '../users.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      usernameField: 'phoneNumber',
    });
  }
  //username ==> phoneNumber
  async validate(username: string, password: string) {
    let user;
    try {
      user = await this.usersService.validateCredentials(username, password);
    } catch (err) {
      console.log('ERROR: in UsersController-->login()');
      throw new InternalServerErrorException();
    }
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}

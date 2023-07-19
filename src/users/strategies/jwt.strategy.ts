import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AccessTokenExpiredException } from '../../exceptions/access-token-expired.exception';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtStrategy implements CanActivate {
  constructor(private reflector: Reflector, private jwtService: JwtService) {}
  canActivate(context: ExecutionContext): boolean {
    let payload;
    const request = context.switchToHttp().getRequest();
    if (!request.cookies.access_token) {
      throw new UnauthorizedException();
    }
    try {
      payload = this.jwtService.verify(request.cookies.access_token);
    } catch (error) {
      if (error.expiredAt) {
        throw new AccessTokenExpiredException();
      }
      throw new UnauthorizedException();
    }
    request.payload = payload;
    return true;
  }
}

import { HttpException } from '@nestjs/common';

export class AccessTokenExpiredException extends HttpException {
  constructor() {
    super('access token expired', 403);
  }
}

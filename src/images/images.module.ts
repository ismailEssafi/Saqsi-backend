import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'src/users/strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: `${process.env.JWT_SECRET}`,
    }),
  ],
  controllers: [ImagesController],
  providers: [ImagesService, JwtStrategy],
})
export class ImagesModule {}

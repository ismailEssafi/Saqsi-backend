import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service';
import { JwtStrategy } from '../users/strategies/jwt.strategy';

@UseGuards(JwtStrategy)
@Controller('images')
export class ImagesController {
  constructor(private imagesService: ImagesService) {}

  @Post('editProfileImg')
  @UseInterceptors(FileInterceptor('file'))
  async editProfileImg(
    @Req() request,
    @Res() response,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          //   new MaxFileSizeValidator({ maxSize: 1000000 }),
          //   new FileTypeValidator({ fileType: 'image/jpeg' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    let imgInfo: any;
    try {
      imgInfo = await this.imagesService.editProfileImg(
        file.originalname,
        file.buffer,
        file.mimetype,
        request.payload.user_id,
      );
    } catch (error) {
      console.log('ERROR: in ImagesController-->editProfileImg()');
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
    }
    return response.status(HttpStatus.CREATED).json({
      imgUrl: imgInfo.Location,
    });
  }

  @Post('editProImgs')
  @UseInterceptors(AnyFilesInterceptor())
  async editProImgs(
    @Req() request,
    @Res() response,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          // new MaxFileSizeValidator({ maxSize: 4000 }),
          //   new FileTypeValidator({ fileType: 'image/jpeg' }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    let proImgs: any;
    try {
      proImgs = await this.imagesService.editProImgs(
        files,
        request.payload.user_id,
      );
    } catch {
      console.log(
        'ERROR: in UsersController-->create() faild to register a user',
      );
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
    }
    return response.status(HttpStatus.ACCEPTED).json(proImgs);
  }

  @Delete('deleteImgs')
  async deleteImgs(
    @Req() request,
    @Res() response,
    @Body() deleteImgs: number[],
  ) {
    try {
      await this.imagesService.deleteImgs(request.payload.user_id, deleteImgs);
    } catch (error) {
      console.log('ERROR: in ImagesController-->editProfileImg()');
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
    }
    return response.status(HttpStatus.ACCEPTED).json();
  }
}

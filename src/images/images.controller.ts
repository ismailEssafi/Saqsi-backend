import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Param,
  ParseFilePipe,
  Post,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service';
import { JwtStrategy } from '../users/strategies/jwt-strategy';

@Controller('images')
export class ImagesController {
  constructor(private imagesService: ImagesService) {}

  @UseGuards(JwtStrategy)
  @Post('editProfileImg/:userId')
  @UseInterceptors(FileInterceptor('file'))
  async editProfileImg(
    @Res() response,
    @Res() request,
    @Param('userId') userId: string,
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
    console.log("🚀 ~ file: images.controller.ts:40 ~ ImagesController ~ request:", request.payload)
    
    const result = await this.imagesService.editProfileImg(
      file.originalname,
      file.buffer,
      file.mimetype,
      userId,
    );
    return result;
  }
  
  @Post('editProImgs/:userid')
  @UseInterceptors(AnyFilesInterceptor())
  async editProImgs(
    @Res() response,
    @Param('userid') userid: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          //   new MaxFileSizeValidator({ maxSize: 1000000 }),
          //   new FileTypeValidator({ fileType: 'image/jpeg' }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    let result: any;
    try {
      result = await this.imagesService.editProImgs(files, userid);
    } catch {
      console.log(
        'ERROR: in UsersController-->create() faild to register a user',
      );
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
    }
    return response.status(HttpStatus.ACCEPTED).json(result.Location);
  }

  @Delete('deleteImgs/:userId')
  async deleteImgs(
    @Param('userid') userId: string,
    @Body() deleteImgs: number[],
  ) {
    await this.imagesService.deleteImgs(userId, deleteImgs);
  }
}

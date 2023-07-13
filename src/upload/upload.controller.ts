import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('editProfileImg')
  @UseInterceptors(FileInterceptor('file'))
  async editProfileImg(
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
    const result = await this.uploadService.uploadOnefile(
      file.originalname,
      file.buffer,
      file.mimetype,
    );
    return result;
  }

  @Post('editProImgs')
  @UseInterceptors(AnyFilesInterceptor())
  async editProImgs(
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
    console.log(
      '🚀 ~ file: upload.controller.ts:51 ~ UploadController ~ files:',
      files,
    );
    const result = await this.uploadService.uploadMultifile(files);
    return result;
  }
}

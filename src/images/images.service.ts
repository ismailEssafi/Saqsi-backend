import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { UsersService } from '../users/users.service';

@Injectable()
export class ImagesService {
  private readonly s3client = new AWS.S3({
    accessKeyId: `${process.env.AWS_ACCESS_KEY_ID}`,
    secretAccessKey: `${process.env.AWS_SECRET_ACCESS_KEY}`,
    region: `${process.env.AWS_REGION}`,
  });
  constructor(private usersService: UsersService) {}

  async editProfileImg(
    filename: string,
    file: Buffer,
    mimetype: string,
    userId: string,
  ) {
    const imgInfo = await this.uploadImg(filename, file, mimetype);
    await this.usersService.editProfileImg(userId, imgInfo.Location);
    return imgInfo;
  }

  async editProImgs(files: any, userId: string) {
    const listImgInfo: any[] = [];
    for (const file of files) {
      const imginfo = await this.uploadImg(
        file.originalname,
        file.buffer,
        file.mimetype,
      );
      listImgInfo.push(imginfo);
    }
    const proImgs = await this.usersService.editProImgs(userId, listImgInfo);
    return proImgs;
  }

  async uploadImg(filename: string, file: Buffer, mimetype: string) {
    return await this.s3client
      .upload({
        Bucket: 'saqsi-bucket',
        Key: filename,
        Body: file,
        ContentType: mimetype,
        ContentDisposition: 'inline',
      })
      .promise();
  }

  async deleteImgs(userId: string, deleteImg: number[]) {
    await this.usersService.deleteImgs(userId, deleteImg);
  }
}

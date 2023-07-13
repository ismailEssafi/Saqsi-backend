import * as AWS from 'aws-sdk';
import { Injectable } from '@nestjs/common';
import { PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class UploadService {
  private readonly s3client = new AWS.S3({
    accessKeyId: `${process.env.AWS_ACCESS_KEY_ID}`,
    secretAccessKey: `${process.env.AWS_SECRET_ACCESS_KEY}`,
    region: `${process.env.AWS_REGION}`,
  });

  async uploadOnefile(filename: string, file: Buffer, mimetype: string) {
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

  async uploadMultifile(files: any) {
    for (const file of files) {
      await this.uploadOnefile(file.originalname, file.buffer, file.mimetype);
      console.log("🚀 ~ file: upload.service.ts:28 ~ UploadService ~ uploadMultifile ~  await this.uploadOnefile(file.originalname, file.buffer, file.mimetype):",  await this.uploadOnefile(file.originalname, file.buffer, file.mimetype))
    }
  }
}

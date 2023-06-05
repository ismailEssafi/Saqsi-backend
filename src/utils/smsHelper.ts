import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
const configService = new ConfigService();
AWS.config.update({
  accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
  secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
  region: configService.get('AWS_REGION'),
});
@Injectable()
export class SmsHelper {
  private sns: AWS.SNS;
  constructor() {
    this.sns = new AWS.SNS({ apiVersion: '2010-03-31' });
  }

  async sendOTP(phoneNumber: string, smsCode: string, cb) {
    const message = `this is your code ${smsCode}`;
    const params = {
      Message: message,
      PhoneNumber: phoneNumber,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: 'SAQSI',
        },
      },
    };

    return this.sns.publish(params, cb);
  }
}

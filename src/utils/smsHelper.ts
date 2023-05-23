import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AWS from 'aws-sdk';
@Injectable()
export class SmsHelper {
  // private sns = new AWS.SNS();
  constructor(private configService: ConfigService, private sns: AWS.SNS) {}

  sendSMSMessageVerifyPhoneNumberCode(phoneNumber: string) {
    const code: number = Math.floor(1000 + Math.random() * 9000);
    const message = `this is your code ${code}`;
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
    const publishTextPromise = this.sns.publish(params).promise();

    publishTextPromise
      .then(function (data) {
        return 'message send success';
        // res.end(JSON.stringify({ MessageID: data.MessageId }));
      })
      .catch(function (err) {
        return 'message nor send error occurred';
        // res.end(JSON.stringify({ Error: err }));
      });
  }
}

import * as cdk from 'aws-cdk-lib';

import { Construct } from 'constructs';

import * as s3 from 'aws-cdk-lib/aws-s3';

export class StorageStack extends cdk.Stack {
  public readonly complaintsBucket:
    s3.Bucket;

  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    this.complaintsBucket =
      new s3.Bucket(
        this,
        'ComplaintsBucket',
        {
          removalPolicy:
            cdk.RemovalPolicy.DESTROY,

          autoDeleteObjects: true,

          cors: [
            {
              allowedMethods: [
                s3.HttpMethods.GET,
                s3.HttpMethods.PUT,
                s3.HttpMethods.POST,
              ],

              allowedOrigins: ['*'],

              allowedHeaders: ['*'],
            },
          ],
        }
      );

    new cdk.CfnOutput(
      this,
      'BucketName',
      {
        value:
          this.complaintsBucket
            .bucketName,
      }
    );
  }
}
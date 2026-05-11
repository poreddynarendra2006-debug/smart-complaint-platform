import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class DatabaseStack extends cdk.Stack {
  public readonly complaintsTable: dynamodb.Table;
  public readonly activityLogsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.complaintsTable = new dynamodb.Table(this, 'ComplaintsTable', {
      partitionKey: {
        name: 'complaintId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.activityLogsTable = new dynamodb.Table(this, 'ActivityLogsTable', {
      partitionKey: {
        name: 'logId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new cdk.CfnOutput(this, 'ComplaintsTableName', {
      value: this.complaintsTable.tableName,
    });

    new cdk.CfnOutput(this, 'ActivityLogsTableName', {
      value: this.activityLogsTable.tableName,
    });
  }
}
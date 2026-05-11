import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { DatabaseStack } from './database-stack';

interface ApiStackProps extends cdk.StackProps {
  databaseStack: DatabaseStack;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const createComplaintFunction = new lambdaNodejs.NodejsFunction(this, 'CreateComplaintFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../backend/src/handlers/createComplaint.ts'),
      projectRoot: path.join(__dirname, '../..'),
      handler: 'handler',
      environment: {
        COMPLAINTS_TABLE: props.databaseStack.complaintsTable.tableName,
        ACTIVITY_LOGS_TABLE: props.databaseStack.activityLogsTable.tableName,
      },
    });
    props.databaseStack.complaintsTable.grantWriteData(createComplaintFunction);
    props.databaseStack.activityLogsTable.grantWriteData(createComplaintFunction);

    const getComplaintsFunction = new lambdaNodejs.NodejsFunction(this, 'GetComplaintsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../backend/src/handlers/getComplaints.ts'),
      projectRoot: path.join(__dirname, '../..'),
      handler: 'handler',
      environment: {
        COMPLAINTS_TABLE: props.databaseStack.complaintsTable.tableName,
      },
    });
    props.databaseStack.complaintsTable.grantReadData(getComplaintsFunction);

    const updateComplaintFunction = new lambdaNodejs.NodejsFunction(this, 'UpdateComplaintFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../backend/src/handlers/updateComplaint.ts'),
      projectRoot: path.join(__dirname, '../..'),
      handler: 'handler',
      environment: {
        COMPLAINTS_TABLE: props.databaseStack.complaintsTable.tableName,
        ACTIVITY_LOGS_TABLE: props.databaseStack.activityLogsTable.tableName,
      },
    });
    props.databaseStack.complaintsTable.grantReadWriteData(updateComplaintFunction);
    props.databaseStack.activityLogsTable.grantWriteData(updateComplaintFunction);

    const deleteComplaintFunction = new lambdaNodejs.NodejsFunction(this, 'DeleteComplaintFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../backend/src/handlers/deleteComplaint.ts'),
      projectRoot: path.join(__dirname, '../..'),
      handler: 'handler',
      environment: {
        COMPLAINTS_TABLE: props.databaseStack.complaintsTable.tableName,
        ACTIVITY_LOGS_TABLE: props.databaseStack.activityLogsTable.tableName,
      },
    });
    props.databaseStack.complaintsTable.grantReadWriteData(deleteComplaintFunction);
    props.databaseStack.activityLogsTable.grantWriteData(deleteComplaintFunction);

    const addCommentFunction = new lambdaNodejs.NodejsFunction(this, 'AddCommentFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../backend/src/handlers/addComment.ts'),
      projectRoot: path.join(__dirname, '../..'),
      handler: 'handler',
      environment: {
        COMPLAINTS_TABLE: props.databaseStack.complaintsTable.tableName,
      },
    });
    props.databaseStack.complaintsTable.grantWriteData(addCommentFunction);

    const getComplaintByIdFunction = new lambdaNodejs.NodejsFunction(this, 'GetComplaintByIdFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../backend/src/handlers/getComplaintById.ts'),
      projectRoot: path.join(__dirname, '../..'),
      handler: 'handler',
      environment: {
        COMPLAINTS_TABLE: props.databaseStack.complaintsTable.tableName,
      },
    });
    props.databaseStack.complaintsTable.grantReadData(getComplaintByIdFunction);

    const logActivityFunction = new lambdaNodejs.NodejsFunction(this, 'LogActivityFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../backend/src/handlers/logActivity.ts'),
      projectRoot: path.join(__dirname, '../..'),
      handler: 'handler',
      environment: {
        ACTIVITY_LOGS_TABLE: props.databaseStack.activityLogsTable.tableName,
      },
    });
    props.databaseStack.activityLogsTable.grantWriteData(logActivityFunction);

    const getActivityLogsFunction = new lambdaNodejs.NodejsFunction(this, 'GetActivityLogsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../backend/src/handlers/getActivityLogs.ts'),
      projectRoot: path.join(__dirname, '../..'),
      handler: 'handler',
      environment: {
        ACTIVITY_LOGS_TABLE: props.databaseStack.activityLogsTable.tableName,
      },
    });
    props.databaseStack.activityLogsTable.grantReadData(getActivityLogsFunction);

    const api = new apigateway.RestApi(this, 'ComplaintApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    const complaints = api.root.addResource('complaints');
    const complaintById = complaints.addResource('{id}');
    const activityLogs = api.root.addResource('activityLogs');

    complaints.addMethod('POST', new apigateway.LambdaIntegration(createComplaintFunction));
    complaints.addMethod('GET', new apigateway.LambdaIntegration(getComplaintsFunction));
    complaints.addMethod('PUT', new apigateway.LambdaIntegration(updateComplaintFunction));
    complaints.addMethod('PATCH', new apigateway.LambdaIntegration(addCommentFunction));
    complaints.addMethod('DELETE', new apigateway.LambdaIntegration(deleteComplaintFunction));
    complaintById.addMethod('GET', new apigateway.LambdaIntegration(getComplaintByIdFunction));
    activityLogs.addMethod('POST', new apigateway.LambdaIntegration(logActivityFunction));
    activityLogs.addMethod('GET', new apigateway.LambdaIntegration(getActivityLogsFunction));

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}
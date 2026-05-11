import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';

interface MonitoringStackProps extends cdk.StackProps {
  // Pass in your Lambda function names after ApiStack deploys
  adminEmail: string; // e.g. 'poreddynarendra2006@gmail.com'
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // ─── SNS Topic for alarm notifications ───────────────────────────────────
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: 'SmartComplaintPlatform-Alarms',
    });

    // Send email when any alarm fires
    alarmTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(props.adminEmail)
    );

    // ─── Helper: create an error alarm for any Lambda by name ─────────────────
    const makeLambdaErrorAlarm = (
      lambdaName: string,
      displayName: string
    ) => {
      const fn = lambda.Function.fromFunctionName(
        this,
        `${displayName}Fn`,
        lambdaName
      );

      const errorsMetric = fn.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      });

      const alarm = new cloudwatch.Alarm(
        this,
        `${displayName}ErrorAlarm`,
        {
          metric: errorsMetric,
          threshold: 1,               // fire if even 1 error happens
          evaluationPeriods: 1,
          alarmDescription: `Lambda ${displayName} has errors`,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
          alarmName: `SmartComplaint-${displayName}-Errors`,
        }
      );

      alarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alarmTopic)
      );

      return { fn, errorsMetric };
    };

    // ─── Helper: duration alarm (slow Lambda) ─────────────────────────────────
    const makeDurationAlarm = (
      lambdaName: string,
      displayName: string,
      thresholdMs: number
    ) => {
      const fn = lambda.Function.fromFunctionName(
        this,
        `${displayName}DurFn`,
        lambdaName
      );

      const durationMetric = fn.metricDuration({
        period: cdk.Duration.minutes(5),
        statistic: 'p95',
      });

      const alarm = new cloudwatch.Alarm(
        this,
        `${displayName}DurationAlarm`,
        {
          metric: durationMetric,
          threshold: thresholdMs,
          evaluationPeriods: 2,
          alarmDescription: `Lambda ${displayName} p95 duration exceeded ${thresholdMs}ms`,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
          alarmName: `SmartComplaint-${displayName}-SlowResponse`,
        }
      );

      alarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alarmTopic)
      );

      return durationMetric;
    };

    // ─── Lambda function logical names (from CDK output) ─────────────────────
    // These are the actual Lambda names in AWS — they follow the CDK pattern:
    // {StackName}-{FunctionId}{RandomSuffix}
    // You can find exact names in: AWS Console → Lambda → Functions
    // OR run: aws lambda list-functions --query 'Functions[*].FunctionName'
    //
    // IMPORTANT: Replace these with your ACTUAL Lambda names from AWS Console!
    const lambdas = [
      { name: 'ApiStack-CreateComplaintFunction5F78F4D6-sK00D9sOcRgd',  display: 'CreateComplaint' },
      { name: 'ApiStack-GetComplaintsFunctionE1F0D808-YiQnB1YVoGou',    display: 'GetComplaints' },
      { name: 'ApiStack-UpdateComplaintFunction5FC1D2A2-QLCJTnHJZP7O',  display: 'UpdateComplaint' },
      { name: 'ApiStack-DeleteComplaintFunction06A2F188-NbjE5eyw6nks',  display: 'DeleteComplaint' },
      { name: 'ApiStack-AddCommentFunctionFBEEA66B-OyGCqlNQAj0r',       display: 'AddComment' },
      { name: 'ApiStack-GetActivityLogsFunctionE478BFBA-VaXbfjz39NM9',  display: 'GetActivityLogs' },
      { name: 'ApiStack-LogActivityFunction083997D4-0VgC3zontqxy',      display: 'LogActivity' },
    ];

    // Create error + duration alarms for every Lambda
    const metricsForDashboard: cloudwatch.IMetric[] = [];

    for (const lam of lambdas) {
      const { errorsMetric } = makeLambdaErrorAlarm(lam.name, lam.display);
      const durationMetric = makeDurationAlarm(lam.name, lam.display, 3000); // alert if > 3s
      metricsForDashboard.push(errorsMetric, durationMetric);
    }

    // ─── CloudWatch Dashboard ─────────────────────────────────────────────────
    const dashboard = new cloudwatch.Dashboard(this, 'SmartComplaintDashboard', {
      dashboardName: 'SmartComplaintPlatform',
    });

    // Row 1: Error counts for all Lambdas
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors (all functions)',
        width: 24,
        left: lambdas.map((lam) =>
          lambda.Function.fromFunctionName(
            this,
            `Dash${lam.display}`,
            lam.name
          ).metricErrors({
            period: cdk.Duration.minutes(5),
            statistic: 'Sum',
            label: lam.display,
          })
        ),
      })
    );

    // Row 2: Invocation counts
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations (all functions)',
        width: 12,
        left: lambdas.map((lam) =>
          lambda.Function.fromFunctionName(
            this,
            `DashInv${lam.display}`,
            lam.name
          ).metricInvocations({
            period: cdk.Duration.minutes(5),
            statistic: 'Sum',
            label: lam.display,
          })
        ),
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration p95 (all functions)',
        width: 12,
        left: lambdas.map((lam) =>
          lambda.Function.fromFunctionName(
            this,
            `DashDur${lam.display}`,
            lam.name
          ).metricDuration({
            period: cdk.Duration.minutes(5),
            statistic: 'p95',
            label: lam.display,
          })
        ),
      })
    );

    // Row 3: Throttles
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Throttles',
        width: 24,
        left: lambdas.map((lam) =>
          lambda.Function.fromFunctionName(
            this,
            `DashThrot${lam.display}`,
            lam.name
          ).metricThrottles({
            period: cdk.Duration.minutes(5),
            statistic: 'Sum',
            label: lam.display,
          })
        ),
      })
    );

    // ─── Outputs ───────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home#dashboards:name=SmartComplaintPlatform`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS Alarm Topic ARN',
    });
  }
}
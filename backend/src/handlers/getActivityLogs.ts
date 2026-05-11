import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

import {
  DynamoDBDocumentClient,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});

const docClient =
  DynamoDBDocumentClient.from(client);

const TABLE_NAME =
  process.env.ACTIVITY_LOGS_TABLE!;

export const handler = async (
  event: any
) => {
  try {
    const complaintId =
      event.queryStringParameters
        ?.complaintId;

    const params: any = {
      TableName: TABLE_NAME,
    };

    // Filter by complaintId if provided
    if (complaintId) {
      params.FilterExpression =
        'complaintId = :complaintId';

      params.ExpressionAttributeValues = {
        ':complaintId': complaintId,
      };
    }

    const result = await docClient.send(
      new ScanCommand(params)
    );

    // Sort by timestamp ascending (oldest first)
    const logs = (result.Items || []).sort(
      (a: any, b: any) =>
        new Date(a.timestamp).getTime() -
        new Date(b.timestamp).getTime()
    );

    return {
      statusCode: 200,

      headers: {
        'Access-Control-Allow-Origin': '*',
      },

      body: JSON.stringify(logs),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,

      headers: {
        'Access-Control-Allow-Origin': '*',
      },

      body: JSON.stringify({
        message: 'Failed to fetch activity logs',
      }),
    };
  }
};

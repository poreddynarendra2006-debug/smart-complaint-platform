import {
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';

import {
  DynamoDBDocumentClient,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';

import { v4 as uuidv4 } from 'uuid';

const client =
  new DynamoDBClient({});

const dynamo =
  DynamoDBDocumentClient.from(client);

const TABLE_NAME =
  process.env.ACTIVITY_LOGS_TABLE!;

export const handler =
  async (event: any) => {
    try {
      const body = JSON.parse(
        event.body
      );

      const log = {
        logId: uuidv4(),

        complaintId:
          body.complaintId,

        action:
          body.action,

        details:
          body.details,

        timestamp:
          new Date().toISOString(),

        userEmail:
          body.userEmail,
      };

      await dynamo.send(
        new PutCommand({
          TableName: TABLE_NAME,

          Item: log,
        })
      );

      return {
        statusCode: 201,

        headers: {
          'Access-Control-Allow-Origin':
            '*',
        },

        body: JSON.stringify({
          message:
            'Activity logged successfully',
        }),
      };
    } catch (error) {
      console.error(error);

      return {
        statusCode: 500,

        headers: {
          'Access-Control-Allow-Origin':
            '*',
        },

        body: JSON.stringify({
          message:
            'Failed to log activity',
        }),
      };
    }
  };
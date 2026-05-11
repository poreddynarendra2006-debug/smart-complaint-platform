import {
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';

import {
  DynamoDBDocumentClient,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});

const docClient =
  DynamoDBDocumentClient.from(client);

export const handler = async (
  event: any
) => {
  try {
    const complaintId =
      event.pathParameters.id;

    const result =
      await docClient.send(
        new GetCommand({
          TableName:
            process.env
              .COMPLAINTS_TABLE,

          Key: {
            complaintId,
          },
        })
      );

    return {
      statusCode: 200,

      headers: {
        'Access-Control-Allow-Origin':
          '*',
      },

      body: JSON.stringify(
        result.Item
      ),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,

      body: JSON.stringify({
        message:
          'Failed to fetch complaint',
      }),
    };
  }
};
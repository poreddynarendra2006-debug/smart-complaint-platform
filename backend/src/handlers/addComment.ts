import {
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';

import {
  DynamoDBDocumentClient,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});

const docClient =
  DynamoDBDocumentClient.from(client);

export const handler = async (
  event: any
) => {
  try {
    const body = JSON.parse(event.body);

    const {
      complaintId,
      text,
    } = body;

    const newComment = {
      text,
      createdAt:
        new Date().toISOString(),
    };

    await docClient.send(
      new UpdateCommand({
        TableName:
          process.env.COMPLAINTS_TABLE,

        Key: {
          complaintId,
        },

        UpdateExpression:
          'SET comments = list_append(if_not_exists(comments, :emptyList), :newComment)',

        ExpressionAttributeValues: {
          ':newComment': [newComment],
          ':emptyList': [],
        },
      })
    );

    return {
      statusCode: 200,

      headers: {
        'Access-Control-Allow-Origin':
          '*',
      },

      body: JSON.stringify({
        message:
          'Comment added successfully',
      }),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,

      body: JSON.stringify({
        message:
          'Failed to add comment',
      }),
    };
  }
};
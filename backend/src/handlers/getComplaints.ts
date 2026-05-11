import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  try {
    const userEmail = event.queryStringParameters?.userEmail;

    const params: any = {
      TableName: process.env.COMPLAINTS_TABLE,
    };

    if (userEmail) {
      params.FilterExpression = 'userEmail = :userEmail';
      params.ExpressionAttributeValues = { ':userEmail': userEmail };
    }

    const result = await docClient.send(new ScanCommand(params));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result.Items || []),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Failed to fetch complaints' }),
    };
  }
};
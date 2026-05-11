import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body);
    const { complaintId, status, userEmail } = body;

    const existing = await docClient.send(new GetCommand({
      TableName: process.env.COMPLAINTS_TABLE,
      Key: { complaintId },
    }));

    const oldStatus = existing.Item?.status || 'UNKNOWN';

    await docClient.send(new UpdateCommand({
      TableName: process.env.COMPLAINTS_TABLE,
      Key: { complaintId },
      UpdateExpression: 'set #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status },
    }));

    await docClient.send(new PutCommand({
      TableName: process.env.ACTIVITY_LOGS_TABLE,
      Item: {
        logId: uuidv4(),
        complaintId,
        action: 'STATUS_UPDATED',
        details: `Status changed from ${oldStatus} to ${status}`,
        timestamp: new Date().toISOString(),
        userEmail: userEmail || 'unknown',
      },
    }));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Complaint updated successfully' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Failed to update complaint' }),
    };
  }
};
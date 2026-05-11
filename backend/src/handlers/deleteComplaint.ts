import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body);
    const { complaintId, userEmail } = body;

    const existing = await docClient.send(new GetCommand({
      TableName: process.env.COMPLAINTS_TABLE,
      Key: { complaintId },
    }));

    const complaintTitle = existing.Item?.title || 'Unknown';

    await docClient.send(new DeleteCommand({
      TableName: process.env.COMPLAINTS_TABLE,
      Key: { complaintId },
    }));

    await docClient.send(new PutCommand({
      TableName: process.env.ACTIVITY_LOGS_TABLE,
      Item: {
        logId: uuidv4(),
        complaintId,
        action: 'COMPLAINT_DELETED',
        details: `Complaint "${complaintTitle}" was deleted`,
        timestamp: new Date().toISOString(),
        userEmail: userEmail || 'unknown',
      },
    }));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Complaint deleted successfully' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Failed to delete complaint' }),
    };
  }
};
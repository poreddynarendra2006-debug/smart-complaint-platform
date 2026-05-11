import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body);
    const { title, description, category, priority, userEmail, imageUrl } = body;

    const complaintId = uuidv4();
    const createdAt = new Date().toISOString();

    await docClient.send(new PutCommand({
      TableName: process.env.COMPLAINTS_TABLE,
      Item: {
        complaintId,
        title,
        description,
        category,
        priority,
        status: 'OPEN',
        userEmail,
        imageUrl: imageUrl || '',
        createdAt,
        comments: [],
      },
    }));

    await docClient.send(new PutCommand({
      TableName: process.env.ACTIVITY_LOGS_TABLE,
      Item: {
        logId: uuidv4(),
        complaintId,
        action: 'COMPLAINT_CREATED',
        details: `Complaint "${title}" was created`,
        timestamp: createdAt,
        userEmail: userEmail || 'unknown',
      },
    }));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Complaint created successfully', complaintId }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Failed to create complaint' }),
    };
  }
};
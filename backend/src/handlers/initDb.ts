import {
  RDSDataClient,
  ExecuteStatementCommand,
} from '@aws-sdk/client-rds-data';

const client = new RDSDataClient({});

const CLUSTER_ARN = process.env.AURORA_CLUSTER_ARN!;
const SECRET_ARN = process.env.AURORA_SECRET_ARN!;
const DATABASE = 'complaintsdb';

export const handler = async () => {
  try {
    // Create users table
    await client.send(new ExecuteStatementCommand({
      resourceArn: CLUSTER_ARN,
      secretArn: SECRET_ARN,
      database: DATABASE,
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255),
          email VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `,
    }));

    // Create complaints table
    await client.send(new ExecuteStatementCommand({
      resourceArn: CLUSTER_ARN,
      secretArn: SECRET_ARN,
      database: DATABASE,
      sql: `
        CREATE TABLE IF NOT EXISTS complaints (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(500) NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'OPEN',
          priority VARCHAR(50) DEFAULT 'LOW',
          category VARCHAR(100) DEFAULT 'GENERAL',
          user_email VARCHAR(255) NOT NULL,
          image_url TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `,
    }));

    // Create complaint_updates table
    await client.send(new ExecuteStatementCommand({
      resourceArn: CLUSTER_ARN,
      secretArn: SECRET_ARN,
      database: DATABASE,
      sql: `
        CREATE TABLE IF NOT EXISTS complaint_updates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
          updated_status VARCHAR(50),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `,
    }));

    console.log('✅ Aurora tables created successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Database initialized successfully' }),
    };
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to initialize database', error }),
    };
  }
};
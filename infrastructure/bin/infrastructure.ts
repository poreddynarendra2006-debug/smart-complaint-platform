#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import { AuthStack }       from '../lib/auth-stack';
import { DatabaseStack }   from '../lib/database-stack';
import { ApiStack }        from '../lib/api-stack';
import { StorageStack }    from '../lib/storage-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region:  process.env.CDK_DEFAULT_REGION,
};

const authStack = new AuthStack(app, 'AuthStack', { env });

const databaseStack = new DatabaseStack(app, 'DatabaseStack', { env });

const storageStack = new StorageStack(app, 'StorageStack', { env });

const apiStack = new ApiStack(app, 'ApiStack', {
  env,
  databaseStack,
});

// ✅ NEW — CloudWatch monitoring + alarms + dashboard
// Replace the email below with your actual admin email
new MonitoringStack(app, 'MonitoringStack', {
  env,
  adminEmail: 'poreddynarendra2006@gmail.com',
});
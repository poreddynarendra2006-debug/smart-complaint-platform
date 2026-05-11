import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  region: 'ap-south-1',
});

export const BUCKET_NAME = 'storagestack-complaintsbucket5c2042cb-lawhvbath5cl';
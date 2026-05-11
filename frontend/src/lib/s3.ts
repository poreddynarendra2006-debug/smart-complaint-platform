import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  region: 'ap-south-1',
});

// This file is kept for reference only - uploads now use presigned URLs
export const BUCKET_NAME = 'storagestack-complaintsbucket5c2042cb-lawhvbath5cl';
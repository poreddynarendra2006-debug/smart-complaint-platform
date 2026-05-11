import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'ap-south-1',
});

export const handler = async (event: any) => {
  const { fileName, fileType } = JSON.parse(event.body || '{}');

  const key = `${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(
    s3,
    command,
    { expiresIn: 60 }
  );

  const imageUrl =
    `https://${process.env.S3_BUCKET}.s3.ap-south-1.amazonaws.com/${key}`;

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      uploadUrl,
      imageUrl,
    }),
  };
};
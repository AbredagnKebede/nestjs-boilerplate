import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  accessKey: process.env.S3_ACCESS_KEY,
  secretKey: process.env.S3_SECRET_KEY,
  bucket: process.env.S3_BUCKET,
  region: process.env.S3_REGION || 'us-east-1',
}));
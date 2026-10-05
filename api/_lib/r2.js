const { S3Client } = require('@aws-sdk/client-s3');
const { required } = require('./config');

let client;

function getR2Client() {
  if (client) return client;
  const accountId = required('R2_ACCOUNT_ID');
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: required('R2_ACCESS_KEY_ID'),
      secretAccessKey: required('R2_SECRET_ACCESS_KEY')
    }
  });
  return client;
}

function getBucketName() {
  return required('R2_BUCKET_NAME');
}

function getPublicBaseUrl() {
  return required('R2_PUBLIC_BASE_URL').replace(/\/$/, '');
}

module.exports = { getR2Client, getBucketName, getPublicBaseUrl };

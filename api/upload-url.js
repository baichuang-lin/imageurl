const { randomUUID } = require('node:crypto');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { json, methodNotAllowed } = require('./_lib/http');
const { getR2Client, getBucketName, getPublicBaseUrl } = require('./_lib/r2');

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif']
]);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const { contentType, size } = req.body || {};
    const extension = ALLOWED_TYPES.get(contentType);
    if (!extension) return json(res, 400, { error: 'Unsupported image type' });
    if (!Number.isInteger(size) || size <= 0 || size > MAX_FILE_SIZE) {
      return json(res, 400, { error: 'Image must be between 1 byte and 5 MB' });
    }

    const publicId = randomUUID();
    const key = `i/${publicId}.${extension}`;
    const bucket = getBucketName();
    const publicBaseUrl = getPublicBaseUrl();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable'
    });
    const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 900 });

    return json(res, 200, {
      uploadId: publicId,
      key,
      uploadUrl,
      publicUrl: `${publicBaseUrl}/${key}`,
      expiresIn: 900
    });
  } catch (error) {
    console.error('upload-url error', error.message);
    return json(res, 500, { error: 'Upload service is not configured' });
  }
};

const { HeadObjectCommand } = require('@aws-sdk/client-s3');
const { json, methodNotAllowed } = require('./_lib/http');
const { getR2Client, getBucketName, getPublicBaseUrl } = require('./_lib/r2');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const { key } = req.body || {};
    if (typeof key !== 'string' || !/^i\/[a-f0-9-]+\.(jpg|png|webp|gif)$/.test(key)) {
      return json(res, 400, { error: 'Invalid upload key' });
    }

    const head = await getR2Client().send(new HeadObjectCommand({
      Bucket: getBucketName(),
      Key: key
    }));

    const publicBaseUrl = getPublicBaseUrl();
    return json(res, 200, {
      status: 'ready',
      key,
      publicUrl: `${publicBaseUrl}/${key}`,
      contentType: head.ContentType,
      size: head.ContentLength,
      lastModified: head.LastModified
    });
  } catch (error) {
    console.error('complete-upload error', error.message);
    return json(res, 500, { error: 'The uploaded image could not be verified' });
  }
};

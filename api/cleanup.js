const { ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { positiveInteger, required } = require('./_lib/config');
const { json, methodNotAllowed } = require('./_lib/http');
const { getR2Client, getBucketName } = require('./_lib/r2');

module.exports = async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return methodNotAllowed(res, ['GET', 'POST']);

  let expected;
  try {
    expected = required('CRON_SECRET');
  } catch (error) {
    console.error('cleanup configuration error', error.message);
    return json(res, 503, { error: 'Cleanup is not configured' });
  }
  const supplied = req.headers.authorization || '';
  if (supplied !== `Bearer ${expected}`) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  try {
    const retentionDays = positiveInteger('ANONYMOUS_RETENTION_DAYS', 90);
    const maxPages = positiveInteger('CLEANUP_MAX_PAGES', 20);
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const client = getR2Client();
    const bucket = getBucketName();
    let continuationToken;
    let scanned = 0;
    let deleted = 0;
    let pages = 0;

    do {
      const result = await client.send(new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: 'i/',
        MaxKeys: 1000,
        ContinuationToken: continuationToken
      }));
      const contents = result.Contents || [];
      scanned += contents.length;
      pages += 1;
      const expired = contents.filter((item) => item.Key && item.LastModified && item.LastModified.getTime() < cutoff);
      if (expired.length) {
        await client.send(new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Quiet: true, Objects: expired.map((item) => ({ Key: item.Key })) }
        }));
        deleted += expired.length;
      }
      continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
    } while (continuationToken && pages < maxPages);

    return json(res, 200, {
      scanned,
      deleted,
      pages,
      truncated: Boolean(continuationToken)
    });
  } catch (error) {
    console.error('cleanup error', error.message);
    return json(res, 500, { error: 'Cleanup failed' });
  }
};

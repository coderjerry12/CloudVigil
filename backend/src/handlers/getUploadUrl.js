const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const { getUserFromEvent } = require('../utils/auth');
const { success, error, forbidden, serverError } = require('../utils/response');

const s3Client = new S3Client({});
const BUCKET = process.env.EVENT_IMAGES_BUCKET;
const CDN_DOMAIN = process.env.IMAGES_CDN_DOMAIN;

/**
 * POST /upload-url
 * Generate a pre-signed PUT URL for uploading an event image.
 * Returns a permanent CloudFront URL for viewing (no expiry).
 *
 * Body: { fileName: string, contentType: string }
 * Returns: { uploadUrl: string, imageUrl: string, key: string }
 */
exports.handler = async (event) => {
  try {
    const user = getUserFromEvent(event);
    if (!user) return forbidden('Authentication required');
    if (user.role !== 'organizer') return forbidden('Only organizers can upload event images');

    const body = JSON.parse(event.body || '{}');
    const { fileName, contentType } = body;

    if (!fileName || !contentType) {
      return error('Missing required fields: fileName, contentType');
    }

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(contentType)) {
      return error(`Invalid content type. Allowed: ${allowedTypes.join(', ')}`);
    }

    // Validate file extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!ext || !allowedExts.includes(ext)) {
      return error(`Invalid file extension. Allowed: ${allowedExts.join(', ')}`);
    }

    // Generate a unique key
    const uniqueId = uuidv4();
    const key = `event-images/${user.userId}/${uniqueId}.${ext}`;

    // Generate pre-signed PUT URL (valid for 5 minutes) for uploading
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      Metadata: {
        'uploaded-by': user.userId,
        'original-name': fileName,
      },
    });
    const uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 300 });

    // Permanent CloudFront URL for viewing (never expires)
    const imageUrl = `https://${CDN_DOMAIN}/${key}`;

    return success({
      uploadUrl,
      imageUrl,
      key,
    });
  } catch (err) {
    console.error('GetUploadUrl error:', err);
    return serverError('Failed to generate upload URL');
  }
};

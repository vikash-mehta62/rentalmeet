const crypto = require('crypto');
const path = require('path');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const REQUIRED_S3_ENV = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET'
];

let s3Client;

const getMissingS3Config = () => REQUIRED_S3_ENV.filter((key) => !process.env[key]);

const getS3Client = () => {
  const missingConfig = getMissingS3Config();
  if (missingConfig.length > 0) {
    throw new Error(`S3 upload is not configured. Missing: ${missingConfig.join(', ')}.`);
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
  }

  return s3Client;
};

const getS3PublicBaseUrl = () => {
  if (process.env.AWS_S3_PUBLIC_BASE_URL) {
    return process.env.AWS_S3_PUBLIC_BASE_URL.replace(/\/$/, '');
  }

  if (!process.env.AWS_S3_BUCKET || !process.env.AWS_REGION) {
    throw new Error('S3 public URL is not configured. Set AWS_S3_PUBLIC_BASE_URL or AWS_S3_BUCKET and AWS_REGION.');
  }

  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
};

const detectContentType = (fileBuffer, fallbackType) => {
  if (fallbackType && fallbackType !== 'application/octet-stream') return fallbackType;
  if (!fileBuffer || fileBuffer.length < 4) return 'application/octet-stream';

  const hex = fileBuffer.subarray(0, 8).toString('hex');
  if (hex.startsWith('ffd8ff')) return 'image/jpeg';
  if (hex.startsWith('89504e47')) return 'image/png';
  if (hex.startsWith('25504446')) return 'application/pdf';
  if (hex.startsWith('52494646') && fileBuffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';

  return 'application/octet-stream';
};

const extensionForContentType = (contentType) => {
  const extensions = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf'
  };

  return extensions[contentType] || 'bin';
};

const sanitizeS3Path = (value) => {
  return String(value || '')
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => part.trim().replace(/[^a-zA-Z0-9._-]/g, '-'))
    .filter(Boolean)
    .join('/');
};

const getSafeExtension = (originalName, contentType) => {
  const extension = path.extname(originalName || '').replace('.', '').toLowerCase();
  return extension.replace(/[^a-z0-9]/g, '') || extensionForContentType(contentType);
};

const uploadToStorage = async (fileBuffer, folder, options = {}) => {
  if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw new Error('No file buffer received for S3 upload.');
  }

  const contentType = detectContentType(fileBuffer, options.contentType);
  const extension = getSafeExtension(options.originalName, contentType);
  const folderPath = sanitizeS3Path(folder || 'general');
  const publicPrefix = sanitizeS3Path(process.env.AWS_S3_PUBLIC_PREFIX || 'public');
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const key = [publicPrefix, folderPath, fileName].filter(Boolean).join('/');

  const putObjectInput = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
    CacheControl: process.env.AWS_S3_CACHE_CONTROL || 'public, max-age=31536000, immutable'
  };

  if (process.env.AWS_S3_ACL) {
    putObjectInput.ACL = process.env.AWS_S3_ACL;
  }

  await getS3Client().send(new PutObjectCommand(putObjectInput));

  const url = `${getS3PublicBaseUrl()}/${key}`;

  return {
    secure_url: url,
    url,
    public_id: key,
    key,
    format: extension,
    bytes: fileBuffer.length,
    resource_type: contentType.startsWith('image/') ? 'image' : 'raw',
    storage: 's3'
  };
};

const deleteFromStorage = async (publicId) => {
  if (!publicId) return;

  await getS3Client().send(new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: publicId
  }));
};

module.exports = {
  uploadToStorage,
  deleteFromStorage,
  getS3PublicBaseUrl
};

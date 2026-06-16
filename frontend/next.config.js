/** @type {import('next').NextConfig} */
const s3ImageDomain = (() => {
  const value = process.env.NEXT_PUBLIC_AWS_S3_PUBLIC_BASE_URL || process.env.AWS_S3_PUBLIC_BASE_URL;
  if (!value) return null;

  try {
    return new URL(value).hostname;
  } catch {
    return value.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
})();

const imageDomains = [
  s3ImageDomain,
  'rentalmeet.s3.ap-south-1.amazonaws.com',
  'res.cloudinary.com'
].filter(Boolean);

const nextConfig = {
  images: {
    domains: [...new Set(imageDomains)],
  },
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  },
}

module.exports = nextConfig;

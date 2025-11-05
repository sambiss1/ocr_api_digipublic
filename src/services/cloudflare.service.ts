import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client for Cloudflare R2 (S3-compatible)
const getS3Client = (): S3Client => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 configuration is missing in environment variables');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

export const uploadToCloudflare = async (
  file: Express.Multer.File,
  folder: string = 'images'
): Promise<string> => {
  try {
    const bucketName = process.env.CLOUDFLARE_BUCKET_NAME;
    const bucketUrl = process.env.CLOUDFLARE_BUCKET_URL;

    if (!bucketName || !bucketUrl) {
      throw new Error('CLOUDFLARE_BUCKET_NAME or CLOUDFLARE_BUCKET_URL is missing');
    }

    // Validate folder name (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_-]+$/.test(folder)) {
      throw new Error('Invalid folder name. Only alphanumeric characters, underscores, and hyphens are allowed.');
    }

    // Optimize image with sharp
    const optimizedBuffer = await sharp(file.buffer)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Generate unique key for the file with folder prefix
    const fileExtension = file.originalname.split('.').pop();
    const key = `${folder}/${uuidv4()}.${fileExtension}`;

    // Upload to R2
    const s3Client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: optimizedBuffer,
      ContentType: file.mimetype,
      ContentLength: optimizedBuffer.length,
    });

    await s3Client.send(command);

    // Construct public URL
    const url = `${bucketUrl}/${key}`;

    console.log(`File uploaded successfully to folder '${folder}': ${key}`);

    return url;
  } catch (error) {
    console.error('Cloudflare upload error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload to Cloudflare R2');
  }
};

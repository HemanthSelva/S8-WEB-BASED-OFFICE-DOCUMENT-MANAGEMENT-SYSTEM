import * as Minio from 'minio';
import dotenv from 'dotenv';

dotenv.config();

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'intellidocx-documents';

export const ensureBucketExists = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      const exists = await minioClient.bucketExists(BUCKET_NAME);
      if (!exists) {
        await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
        console.log(`Bucket ${BUCKET_NAME} created successfully.`);
      }
      return;
    } catch (err) {
      console.error(`Error ensuring bucket exists (attempt ${i + 1}/${retries}):`, err);
      if (i === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s before retry
    }
  }
};

export const getPresignedUploadUrl = async (objectName: string) => {
  return await minioClient.presignedPutObject(BUCKET_NAME, objectName, 24 * 60 * 60); // 1 day expiry
};

export const uploadFileStream = async (objectName: string, stream: any, size: number, metaData: Minio.ItemBucketMetadata) => {
  return await minioClient.putObject(BUCKET_NAME, objectName, stream, size, metaData);
};

export const getFileStream = async (objectName: string) => {
  return await minioClient.getObject(BUCKET_NAME, objectName);
};

export const deleteFile = async (objectName: string) => {
  return await minioClient.removeObject(BUCKET_NAME, objectName);
};

export default minioClient;

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { nanoid } from 'nanoid';

// AWS S3 configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'nexora-models';
const CDN_DOMAIN = process.env.CLOUDFRONT_DOMAIN || `${BUCKET_NAME}.s3.amazonaws.com`;

export interface UploadedFile {
  originalName: string;
  key: string;
  url: string;
  size: number;
  mimeType: string;
  metadata?: Record<string, any>;
}

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

class FileUploadService {
  
  /**
   * Upload a 3D model file to S3
   */
  async uploadFile(file: Express.Multer.File, modelId: string): Promise<string> {
    try {
      const fileExtension = path.extname(file.originalname);
      const fileName = `models/${modelId}/${nanoid(8)}${fileExtension}`;
      
      const fileBuffer = await fs.readFile(file.path);
      
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: file.mimetype,
        ContentDisposition: `attachment; filename="${file.originalname}"`,
        Metadata: {
          originalName: file.originalname,
          modelId: modelId,
          uploadedAt: new Date().toISOString(),
        },
      };

      await s3Client.send(new PutObjectCommand(uploadParams));
      
      // Clean up temp file
      try {
        await fs.unlink(file.path);
      } catch (error) {
        console.warn('Failed to cleanup temp file:', error);
      }

      const fileUrl = `https://${CDN_DOMAIN}/${fileName}`;
      return fileUrl;
      
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Failed to upload file to cloud storage');
    }
  }

  /**
   * Upload processed GLB/USDZ files
   */
  async uploadProcessedModel(
    filePath: string, 
    modelId: string, 
    format: 'glb' | 'usdz',
    originalFileName?: string
  ): Promise<string> {
    try {
      const fileName = `models/${modelId}/processed/${nanoid(8)}.${format}`;
      const fileBuffer = await fs.readFile(filePath);
      
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: format === 'glb' ? 'model/gltf-binary' : 'model/vnd.usdz+zip',
        ContentDisposition: `inline; filename="${modelId}.${format}"`,
        CacheControl: 'public, max-age=31536000', // Cache for 1 year
        Metadata: {
          modelId: modelId,
          format: format,
          processedAt: new Date().toISOString(),
          originalFileName: originalFileName || '',
        },
      };

      await s3Client.send(new PutObjectCommand(uploadParams));
      
      const fileUrl = `https://${CDN_DOMAIN}/${fileName}`;
      return fileUrl;
      
    } catch (error) {
      console.error('Error uploading processed model to S3:', error);
      throw new Error(`Failed to upload processed ${format.toUpperCase()} file`);
    }
  }

  /**
   * Generate and upload thumbnail for 3D model
   */
  async generateThumbnail(
    modelPath: string, 
    modelId: string, 
    options: ThumbnailOptions = {}
  ): Promise<string> {
    try {
      const { 
        width = 400, 
        height = 400, 
        quality = 85,
        format = 'jpeg' 
      } = options;

      // For now, create a placeholder thumbnail
      // In production, you'd use a 3D rendering service like Three.js headless or Blender
      const placeholderBuffer = await this.createPlaceholderThumbnail(width, height, format);
      
      const fileName = `models/${modelId}/thumbnail.${format}`;
      
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: placeholderBuffer,
        ContentType: `image/${format}`,
        CacheControl: 'public, max-age=86400', // Cache for 1 day
        Metadata: {
          modelId: modelId,
          type: 'thumbnail',
          generatedAt: new Date().toISOString(),
        },
      };

      await s3Client.send(new PutObjectCommand(uploadParams));
      
      const thumbnailUrl = `https://${CDN_DOMAIN}/${fileName}`;
      return thumbnailUrl;
      
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw new Error('Failed to generate model thumbnail');
    }
  }

  /**
   * Create a placeholder thumbnail using Sharp
   */
  private async createPlaceholderThumbnail(
    width: number, 
    height: number, 
    format: string
  ): Promise<Buffer> {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#6366F1;stop-opacity:0.2" />
            <stop offset="100%" style="stop-color:#22D3EE;stop-opacity:0.2" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height)/6}" fill="#6366F1" opacity="0.6"/>
        <text x="${width/2}" y="${height/2 + 8}" font-family="Arial, sans-serif" font-size="12" fill="#6366F1" text-anchor="middle" opacity="0.8">3D Model</text>
      </svg>
    `;

    let sharpInstance = sharp(Buffer.from(svg));
    
    if (format === 'png') {
      sharpInstance = sharpInstance.png({ quality: 90 });
    } else if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality: 85 });
    } else {
      sharpInstance = sharpInstance.jpeg({ quality: 85 });
    }

    return await sharpInstance.toBuffer();
  }

  /**
   * Upload workspace logo
   */
  async uploadLogo(file: Express.Multer.File, workspaceId: string): Promise<string> {
    try {
      // Resize and optimize logo
      const optimizedBuffer = await sharp(file.buffer)
        .resize(512, 512, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ quality: 90 })
        .toBuffer();

      const fileName = `logos/${workspaceId}/${nanoid(8)}.png`;
      
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: optimizedBuffer,
        ContentType: 'image/png',
        CacheControl: 'public, max-age=86400',
        Metadata: {
          workspaceId: workspaceId,
          type: 'logo',
          uploadedAt: new Date().toISOString(),
        },
      };

      await s3Client.send(new PutObjectCommand(uploadParams));
      
      const logoUrl = `https://${CDN_DOMAIN}/${fileName}`;
      return logoUrl;
      
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw new Error('Failed to upload logo');
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const key = fileUrl.replace(`https://${CDN_DOMAIN}/`, '');
      
      const deleteParams = {
        Bucket: BUCKET_NAME,
        Key: key,
      };

      await s3Client.send(new DeleteObjectCommand(deleteParams));
      
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw new Error('Failed to delete file from cloud storage');
    }
  }

  /**
   * Generate a presigned URL for direct uploads (for large files)
   */
  async getPresignedUploadUrl(
    modelId: string, 
    fileName: string, 
    contentType: string,
    expiresIn: number = 3600
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    try {
      const key = `models/${modelId}/upload/${nanoid(8)}_${fileName}`;
      
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        Metadata: {
          modelId: modelId,
          originalName: fileName,
        },
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
      const fileUrl = `https://${CDN_DOMAIN}/${key}`;
      
      return { uploadUrl, fileUrl };
      
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileUrl: string): Promise<any> {
    try {
      const key = fileUrl.replace(`https://${CDN_DOMAIN}/`, '');
      
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);
      
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
      
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }

  /**
   * Clean up old files for a model
   */
  async cleanupModelFiles(modelId: string): Promise<void> {
    try {
      // This would typically list all files with the modelId prefix and delete them
      // Implementation depends on specific cleanup requirements
      console.log(`Cleaning up files for model: ${modelId}`);
      
    } catch (error) {
      console.error('Error cleaning up model files:', error);
    }
  }
}

export const fileUploadService = new FileUploadService();

import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

export interface CloudinaryResponse {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'sureshops',
  ): Promise<CloudinaryResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            reject(new BadRequestException('Failed to upload image'));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
            });
          }
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'sureshops',
  ): Promise<CloudinaryResponse[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      throw new BadRequestException('Failed to delete image');
    }
  }

  async uploadShopEntrance(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return this.uploadImage(file, 'sureshops/shop-entrances');
  }

  async uploadShopLogo(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'sureshops/logos',
          resource_type: 'image',
          transformation: [
            { width: 500, height: 500, crop: 'fill' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            reject(new BadRequestException('Failed to upload logo'));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
            });
          }
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async uploadMarketLayout(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return this.uploadImage(file, 'sureshops/market-layouts');
  }

  async uploadProductImage(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return this.uploadImage(file, 'sureshops/products');
  }
}
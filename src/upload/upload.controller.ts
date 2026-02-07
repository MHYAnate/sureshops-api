import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Param,
  Delete,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadImage(file);
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    return this.uploadService.uploadMultipleImages(files);
  }

  @Post('shop-entrance')
  @UseInterceptors(FileInterceptor('file'))
  async uploadShopEntrance(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadShopEntrance(file);
  }

  @Post('shop-logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadShopLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadShopLogo(file);
  }

  @Post('market-layout')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMarketLayout(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadMarketLayout(file);
  }

  @Post('product')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadProductImage(file);
  }

  @Delete(':publicId')
  async deleteImage(@Param('publicId') publicId: string) {
    return this.uploadService.deleteImage(publicId);
  }
}
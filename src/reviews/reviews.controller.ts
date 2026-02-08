import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get('product/:productId')
  getProductReviews(
    @Param('productId') productId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.findByProduct(productId, page, limit);
  }

  @Get('vendor/:vendorId')
  getVendorReviews(
    @Param('vendorId') vendorId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.findByVendor(vendorId, page, limit);
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  getMyReviews(@Request() req) {
    return this.reviewsService.findByUser(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @Request() req) {
    return this.reviewsService.delete(id, req.user.id);
  }

  @Post(':id/helpful')
  markHelpful(@Param('id') id: string) {
    return this.reviewsService.markHelpful(id);
  }
}
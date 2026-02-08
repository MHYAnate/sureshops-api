import {
  Controller,
  Get,
  Query,
  Param,
  InternalServerErrorException,
} from '@nestjs/common';
import { SearchService } from './search.service';
import {
  SearchDto,
  ProductSearchDto,
  ShopSearchDto,
} from './dto/search.dto';

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  // Main search endpoint - searches both products and shops
  @Get()
  async search(@Query() dto: SearchDto) {
    try {
      return await this.searchService.search(dto);
    } catch (error) {
      console.error('Search controller error:', error.message, error.stack);
      throw new InternalServerErrorException(
        `Search failed: ${error.message}`,
      );
    }
  }

  // Search products only
  @Get('products')
  async searchProducts(@Query() dto: ProductSearchDto) {
    try {
      dto.searchType = 'products' as any;
      return await this.searchService.searchProducts(dto);
    } catch (error) {
      console.error(
        'Product search controller error:',
        error.message,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Product search failed: ${error.message}`,
      );
    }
  }

  // Search shops only
  @Get('shops')
  async searchShops(@Query() dto: ShopSearchDto) {
    try {
      return await this.searchService.searchShops(dto);
    } catch (error) {
      console.error(
        'Shop search controller error:',
        error.message,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Shop search failed: ${error.message}`,
      );
    }
  }

  // Get all vendors selling a specific product with price comparison
  @Get('product/:productName/vendors')
  async getProductVendors(
    @Param('productName') productName: string,
    @Query() filters: SearchDto,
  ) {
    try {
      return await this.searchService.getProductVendors(
        productName,
        filters,
      );
    } catch (error) {
      console.error(
        'Product vendors controller error:',
        error.message,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Product vendors search failed: ${error.message}`,
      );
    }
  }

  // Get product comparison across vendors
  @Get('compare')
  async getProductComparison(@Query() dto: SearchDto) {
    try {
      return await this.searchService.getProductComparison(dto);
    } catch (error) {
      console.error(
        'Product comparison controller error:',
        error.message,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Product comparison failed: ${error.message}`,
      );
    }
  }

  // Get a shop's products
  @Get('shop/:vendorId/products')
  async getShopProducts(
    @Param('vendorId') vendorId: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      return await this.searchService.getShopProducts(vendorId, {
        category,
        minPrice,
        maxPrice,
        page,
        limit,
      });
    } catch (error) {
      console.error(
        'Shop products controller error:',
        error.message,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Shop products search failed: ${error.message}`,
      );
    }
  }

  // Get similar products
  @Get('product/:productId/similar')
  async getSimilarProducts(
    @Param('productId') productId: string,
    @Query('limit') limit?: number,
  ) {
    try {
      return await this.searchService.getSimilarProducts(productId, limit);
    } catch (error) {
      console.error(
        'Similar products controller error:',
        error.message,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Similar products search failed: ${error.message}`,
      );
    }
  }

  // Get available filters for current search
  @Get('filters')
  async getFilters(@Query() dto: SearchDto) {
    try {
      return await this.searchService.getAvailableFilters(dto);
    } catch (error) {
      console.error(
        'Filters controller error:',
        error.message,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Filters retrieval failed: ${error.message}`,
      );
    }
  }
}
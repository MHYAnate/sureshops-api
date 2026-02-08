import {
  Controller,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchDto, ProductSearchDto, ShopSearchDto } from './dto/search.dto';

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  // Main search endpoint - searches both products and shops
  @Get()
  search(@Query() dto: SearchDto) {
    return this.searchService.search(dto);
  }

  // Search products only
  @Get('products')
  searchProducts(@Query() dto: ProductSearchDto) {
    dto.searchType = 'products' as any;
    return this.searchService.searchProducts(dto);
  }

  // Search shops only
  @Get('shops')
  searchShops(@Query() dto: ShopSearchDto) {
    return this.searchService.searchShops(dto);
  }

  // Get all vendors selling a specific product with price comparison
  @Get('product/:productName/vendors')
  getProductVendors(
    @Param('productName') productName: string,
    @Query() filters: SearchDto,
  ) {
    return this.searchService.getProductVendors(productName, filters);
  }

  // Get product comparison across vendors
  @Get('compare')
  getProductComparison(@Query() dto: SearchDto) {
    return this.searchService.getProductComparison(dto);
  }

  // Get a shop's products
  @Get('shop/:vendorId/products')
  getShopProducts(
    @Param('vendorId') vendorId: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.getShopProducts(vendorId, {
      category,
      minPrice,
      maxPrice,
      page,
      limit,
    });
  }

  // Get similar products
  @Get('product/:productId/similar')
  getSimilarProducts(
    @Param('productId') productId: string,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.getSimilarProducts(productId, limit);
  }

  // Get available filters for current search
  @Get('filters')
  getFilters(@Query() dto: SearchDto) {
    return this.searchService.getAvailableFilters(dto);
  }
}
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Vendor, VendorSchema } from '../vendors/schemas/vendor.schema';
import { CatalogItem, CatalogItemSchema } from '../catalog/schemas/catalog-item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: CatalogItem.name, schema: CatalogItemSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminSeeder } from '../database/seeders/admin.seeder';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Vendor, VendorSchema } from '../vendors/schemas/vendor.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { State, StateSchema } from '../states/schemas/state.schema';
import { Area, AreaSchema } from '../areas/schemas/area.schema';
import { Market, MarketSchema } from '../markets/schemas/market.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Product.name, schema: ProductSchema },
      { name: State.name, schema: StateSchema },
      { name: Area.name, schema: AreaSchema },
      { name: Market.name, schema: MarketSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminSeeder],
  exports: [AdminService, AdminSeeder],
})
export class AdminModule {}
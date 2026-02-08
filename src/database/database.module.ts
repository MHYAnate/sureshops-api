import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { State, StateSchema } from '../states/schemas/state.schema';
import { Area, AreaSchema } from '../areas/schemas/area.schema';
import { Market, MarketSchema } from '../markets/schemas/market.schema';
import { CatalogItem, CatalogItemSchema } from '../catalog/schemas/catalog-item.schema';
import {
  AdminSeeder,
  StatesSeeder,
  AreasSeeder,
  MarketsSeeder,
  CategoriesSeeder,
  MasterSeeder,
} from './seeders';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: State.name, schema: StateSchema },
      { name: Area.name, schema: AreaSchema },
      { name: Market.name, schema: MarketSchema },
      { name: CatalogItem.name, schema: CatalogItemSchema },
    ]),
  ],
  providers: [
    AdminSeeder,
    StatesSeeder,
    AreasSeeder,
    MarketsSeeder,
    CategoriesSeeder,
    MasterSeeder,
  ],
  exports: [
    AdminSeeder,
    StatesSeeder,
    AreasSeeder,
    MarketsSeeder,
    CategoriesSeeder,
    MasterSeeder,
  ],
})
export class DatabaseModule {}
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { Vendor, VendorSchema } from './schemas/vendor.schema';
import { MarketsModule } from '../markets/markets.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Vendor.name, schema: VendorSchema }]),
    MarketsModule,
    UsersModule,
  ],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
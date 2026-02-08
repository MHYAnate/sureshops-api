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
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { FilterVendorDto } from './dto/filter-vendor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('vendors')
export class VendorsController {
  constructor(private vendorsService: VendorsService) {}

  @Get()
  findAll(@Query() filterDto: FilterVendorDto) {
    return this.vendorsService.findAll(filterDto);
  }

  @Get('my-profile')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@Request() req) {
    return this.vendorsService.findByUser(req.user.id);
  }

  @Get('market/:marketId')
  findByMarket(@Param('marketId') marketId: string) {
    return this.vendorsService.findByMarket(marketId);
  }

  @Get('nearby')
  findNearby(
    @Query('longitude') longitude: number,
    @Query('latitude') latitude: number,
    @Query('distance') distance?: number,
  ) {
    return this.vendorsService.findNearby(longitude, latitude, distance);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vendorsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateVendorDto, @Request() req) {
    return this.vendorsService.create(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateVendorDto, @Request() req) {
    return this.vendorsService.update(id, dto, req.user.id);
  }

  @Put(':id/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  adminUpdate(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.vendorsService.adminUpdate(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @Request() req) {
    return this.vendorsService.delete(id, req.user.id);
  }
}
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { FilterCatalogDto } from './dto/filter-catalog.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  @Get()
  findAll(@Query() filterDto: FilterCatalogDto) {
    return this.catalogService.findAll(filterDto);
  }

  @Get('categories')
  getCategories() {
    return this.catalogService.getCategories();
  }

  @Get('brands')
  getBrands(@Query('category') category?: string) {
    return this.catalogService.getBrands(category);
  }

  @Get('search')
  searchByName(@Query('name') name: string) {
    return this.catalogService.searchByName(name);
  }

  @Get('sku/:sku')
  findBySku(@Param('sku') sku: string) {
    return this.catalogService.findBySku(sku);
  }

  @Get('barcode/:barcode')
  findByBarcode(@Param('barcode') barcode: string) {
    return this.catalogService.findByBarcode(barcode);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.catalogService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateCatalogItemDto) {
    return this.catalogService.create(dto);
  }
}
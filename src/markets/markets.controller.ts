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
} from '@nestjs/common';
import { MarketsService } from './markets.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { FilterMarketDto } from './dto/filter-market.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('markets')
export class MarketsController {
  constructor(private marketsService: MarketsService) {}

  @Get()
  findAll(@Query() filterDto: FilterMarketDto) {
    return this.marketsService.findAll(filterDto);
  }

  @Get('area/:areaId')
  findByArea(@Param('areaId') areaId: string) {
    return this.marketsService.findByArea(areaId);
  }

  @Get('nearby')
  findNearby(
    @Query('longitude') longitude: number,
    @Query('latitude') latitude: number,
    @Query('distance') distance?: number,
  ) {
    return this.marketsService.findNearby(longitude, latitude, distance);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.marketsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateMarketDto) {
    return this.marketsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateMarketDto) {
    return this.marketsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  delete(@Param('id') id: string) {
    return this.marketsService.delete(id);
  }
}
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
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('areas')
export class AreasController {
  constructor(private areasService: AreasService) {}

  @Get()
  findAll() {
    return this.areasService.findAll();
  }

  @Get('state/:stateId')
  findByState(@Param('stateId') stateId: string) {
    return this.areasService.findByState(stateId);
  }

  @Get('nearby')
  findNearby(
    @Query('longitude') longitude: number,
    @Query('latitude') latitude: number,
    @Query('distance') distance?: number,
  ) {
    return this.areasService.findNearby(longitude, latitude, distance);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.areasService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateAreaDto) {
    return this.areasService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateAreaDto) {
    return this.areasService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  delete(@Param('id') id: string) {
    return this.areasService.delete(id);
  }
}
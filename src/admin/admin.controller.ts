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
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ProductStatus } from '../common/enums/product-status.enum';
import { AdminUpdateUserDto, AdminCreateUserDto } from './dto/admin-update-user.dto';
import { AdminUpdateVendorDto, AdminVendorActionDto } from './dto/admin-update-vendor.dto';
import { AdminUpdateProductDto, AdminProductActionDto } from './dto/admin-update-product.dto';
import { AdminSeeder } from '../database/seeders/admin.seeder';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminController {
  constructor(private adminService: AdminService,  private adminSeeder: AdminSeeder, ) {}



  @Post('seed/admins')
@Roles(Role.SUPER_ADMIN)
async seedAdmins() {
  await this.adminSeeder.seed();
  return { message: 'Admins seeded successfully' };
}

@Get('seed/admins/list')
@Roles(Role.SUPER_ADMIN)
async listSeededAdmins() {
  return this.adminSeeder.listAdmins();
}

  // ==================== DASHBOARD ====================

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('dashboard/activity')
  getRecentActivity(@Query('limit') limit?: number) {
    return this.adminService.getRecentActivity(limit);
  }

  // ==================== USER MANAGEMENT ====================

  @Get('users')
  getAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: Role,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.adminService.getAllUsers({ page, limit, role, search, isActive });
  }

  @Get('users/:id')
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Post('users')
  @Roles(Role.SUPER_ADMIN)
  createUser(@Body() dto: AdminCreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Put('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @Roles(Role.SUPER_ADMIN)
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Put('users/:id/role')
  @Roles(Role.SUPER_ADMIN)
  changeUserRole(@Param('id') id: string, @Body('role') role: Role) {
    return this.adminService.changeUserRole(id, role);
  }

  // ==================== VENDOR MANAGEMENT ====================

  @Get('vendors')
  getAllVendors(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isVerified') isVerified?: boolean,
    @Query('isFeatured') isFeatured?: boolean,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllVendors({ page, limit, isVerified, isFeatured, search });
  }

  @Get('vendors/pending')
  getPendingVendors() {
    return this.adminService.getPendingVendors();
  }

  @Get('vendors/:id')
  getVendorById(@Param('id') id: string) {
    return this.adminService.getVendorById(id);
  }

  @Put('vendors/:id')
  updateVendor(@Param('id') id: string, @Body() dto: AdminUpdateVendorDto) {
    return this.adminService.updateVendor(id, dto);
  }

  @Post('vendors/:id/action')
  vendorAction(@Param('id') id: string, @Body() dto: AdminVendorActionDto) {
    return this.adminService.vendorAction(id, dto);
  }

  // ==================== PRODUCT MANAGEMENT ====================

  @Get('products')
  getAllProducts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: ProductStatus,
    @Query('search') search?: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.adminService.getAllProducts({ page, limit, status, search, vendorId });
  }

  @Get('products/pending')
  getPendingProducts() {
    return this.adminService.getPendingProducts();
  }

  @Get('products/:id')
  getProductById(@Param('id') id: string) {
    return this.adminService.getProductById(id);
  }

  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: AdminUpdateProductDto) {
    return this.adminService.updateProduct(id, dto);
  }

  @Post('products/:id/action')
  productAction(@Param('id') id: string, @Body() dto: AdminProductActionDto) {
    return this.adminService.productAction(id, dto);
  }

  @Post('products/bulk-approve')
  bulkApproveProducts(@Body('ids') ids: string[]) {
    return this.adminService.bulkApproveProducts(ids);
  }

  @Post('products/bulk-reject')
  bulkRejectProducts(@Body('ids') ids: string[], @Body('reason') reason?: string) {
    return this.adminService.bulkRejectProducts(ids, reason);
  }
}
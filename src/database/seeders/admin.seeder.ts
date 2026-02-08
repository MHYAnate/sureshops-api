import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User } from '../../users/schemas/user.schema';
import { Role } from '../../common/enums/role.enum';

export interface AdminSeedData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
}

@Injectable()
export class AdminSeeder {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  private getDefaultAdmins(): AdminSeedData[] {
    return [
      {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@sureshops.com',
        password: 'SuperAdmin@123!',
        phone: '08000000001',
        role: Role.SUPER_ADMIN,
      },
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@sureshops.com',
        password: 'Admin@123!',
        phone: '08000000002',
        role: Role.ADMIN,
      },
      {
        firstName: 'Test',
        lastName: 'Vendor',
        email: 'vendor@sureshops.com',
        password: 'Vendor@123!',
        phone: '08000000003',
        role: Role.VENDOR,
      },
      {
        firstName: 'Test',
        lastName: 'User',
        email: 'user@sureshops.com',
        password: 'User@123!',
        phone: '08000000004',
        role: Role.USER,
      },
    ];
  }

  async seed(): Promise<void> {
    this.logger.log('Starting admin seeder...');

    const admins = this.getDefaultAdmins();

    for (const admin of admins) {
      try {
        const exists = await this.userModel.findOne({ email: admin.email.toLowerCase() });

        if (exists) {
          this.logger.warn(`User already exists: ${admin.email}`);
          continue;
        }

        const hashedPassword = await bcrypt.hash(admin.password, 12);

        await this.userModel.create({
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email.toLowerCase(),
          password: hashedPassword,
          phone: admin.phone,
          role: admin.role,
          isActive: true,
          isEmailVerified: true,
        });

        this.logger.log(`Created ${admin.role}: ${admin.email}`);
      } catch (error) {
        this.logger.error(`Failed to create ${admin.email}: ${error.message}`);
      }
    }

    this.logger.log('Admin seeder completed!');
  }

  async seedCustomAdmin(data: AdminSeedData): Promise<User> {
    const exists = await this.userModel.findOne({ email: data.email.toLowerCase() });

    if (exists) {
      throw new Error(`User already exists: ${data.email}`);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await this.userModel.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      phone: data.phone,
      role: data.role,
      isActive: true,
      isEmailVerified: true,
    });

    this.logger.log(`Created custom admin: ${data.email}`);
    return user;
  }

  async removeSeededAdmins(): Promise<void> {
    const admins = this.getDefaultAdmins();
    const emails = admins.map((a) => a.email.toLowerCase());

    await this.userModel.deleteMany({ email: { $in: emails } });
    this.logger.log('Removed all seeded admins');
  }

  async listAdmins(): Promise<User[]> {
    return this.userModel
      .find({ role: { $in: [Role.ADMIN, Role.SUPER_ADMIN] } })
      .select('-password')
      .sort({ createdAt: -1 });
  }
}
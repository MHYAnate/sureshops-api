import { Injectable, Logger } from '@nestjs/common';
import { AdminSeeder } from './admin.seeder';
import { StatesSeeder } from './states.seeder';
import { AreasSeeder } from './areas.seeder';
import { MarketsSeeder } from './markets.seeder';
import { CategoriesSeeder } from './categories.seeder';

@Injectable()
export class MasterSeeder {
  private readonly logger = new Logger(MasterSeeder.name);

  constructor(
    private adminSeeder: AdminSeeder,
    private statesSeeder: StatesSeeder,
    private areasSeeder: AreasSeeder,
    private marketsSeeder: MarketsSeeder,
    private categoriesSeeder: CategoriesSeeder,
  ) {}

  async seedAll(): Promise<void> {
    this.logger.log('Starting master seed...');

    try {
      // Seed in order of dependencies
      await this.statesSeeder.seed();
      await this.areasSeeder.seed();
      await this.marketsSeeder.seed();
      await this.categoriesSeeder.seed();
      await this.adminSeeder.seed();

      this.logger.log('Master seed completed successfully!');
    } catch (error) {
      this.logger.error(`Master seed failed: ${error.message}`);
      throw error;
    }
  }

  async seedLocations(): Promise<void> {
    await this.statesSeeder.seed();
    await this.areasSeeder.seed();
    await this.marketsSeeder.seed();
  }

  async seedUsers(): Promise<void> {
    await this.adminSeeder.seed();
  }

  async seedCatalog(): Promise<void> {
    await this.categoriesSeeder.seed();
  }
}
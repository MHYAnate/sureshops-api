import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MasterSeeder, AdminSeeder, StatesSeeder, AreasSeeder, MarketsSeeder, CategoriesSeeder } from '../database/seeders';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('SeedCommand');

  try {
    logger.log('Initializing application...');
    const app = await NestFactory.createApplicationContext(AppModule);

    const masterSeeder = app.get(MasterSeeder);
    const adminSeeder = app.get(AdminSeeder);
    const statesSeeder = app.get(StatesSeeder);
    const areasSeeder = app.get(AreasSeeder);
    const marketsSeeder = app.get(MarketsSeeder);
    const categoriesSeeder = app.get(CategoriesSeeder);

    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'all':
        await masterSeeder.seedAll();
        break;

      case 'locations':
        await masterSeeder.seedLocations();
        break;

      case 'admins':
        await adminSeeder.seed();
        break;

      case 'states':
        await statesSeeder.seed();
        break;

      case 'areas':
        await areasSeeder.seed();
        break;

      case 'markets':
        await marketsSeeder.seed();
        break;

      case 'categories':
        await categoriesSeeder.seed();
        break;

      case 'admins:list':
        const admins = await adminSeeder.listAdmins();
        console.table(
          admins.map((a) => ({
            id: a._id.toString(),
            name: `${a.firstName} ${a.lastName}`,
            email: a.email,
            role: a.role,
          })),
        );
        break;

      default:
        logger.log('Available commands:');
        logger.log('  npm run seed all        - Seed everything');
        logger.log('  npm run seed locations  - Seed states, areas, markets');
        logger.log('  npm run seed admins     - Seed admin users');
        logger.log('  npm run seed states     - Seed Nigerian states');
        logger.log('  npm run seed areas      - Seed areas');
        logger.log('  npm run seed markets    - Seed markets');
        logger.log('  npm run seed categories - Seed product categories');
        logger.log('  npm run seed admins:list - List all admins');
        break;
    }

    await app.close();
    logger.log('Done!');
    process.exit(0);
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminSeeder } from '../database/seeders/admin.seeder';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('SeedCommand');

  try {
    logger.log('Initializing application...');
    const app = await NestFactory.createApplicationContext(AppModule);

    const adminSeeder = app.get(AdminSeeder);

    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'admins':
        await adminSeeder.seed();
        break;

      case 'admins:remove':
        await adminSeeder.removeSeededAdmins();
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
        logger.log('  npm run seed admins       - Seed default admin users');
        logger.log('  npm run seed admins:remove - Remove seeded admins');
        logger.log('  npm run seed admins:list   - List all admins');
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
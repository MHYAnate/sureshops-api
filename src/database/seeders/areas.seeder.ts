import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Area } from '../../areas/schemas/area.schema';
import { State } from '../../states/schemas/state.schema';

@Injectable()
export class AreasSeeder {
  private readonly logger = new Logger(AreasSeeder.name);

  constructor(
    @InjectModel(Area.name) private areaModel: Model<Area>,
    @InjectModel(State.name) private stateModel: Model<State>,
  ) {}

  private getAreasData() {
    return {
      LA: [
        { name: 'Ikeja', localGovernment: 'Ikeja', coordinates: [3.3517, 6.5963] },
        { name: 'Lekki', localGovernment: 'Eti-Osa', coordinates: [3.4746, 6.4698] },
        { name: 'Victoria Island', localGovernment: 'Eti-Osa', coordinates: [3.4219, 6.4281] },
        { name: 'Surulere', localGovernment: 'Surulere', coordinates: [3.3569, 6.4969] },
        { name: 'Yaba', localGovernment: 'Yaba', coordinates: [3.3792, 6.5097] },
        { name: 'Lagos Island', localGovernment: 'Lagos Island', coordinates: [3.3903, 6.4549] },
        { name: 'Ikoyi', localGovernment: 'Eti-Osa', coordinates: [3.4373, 6.4500] },
        { name: 'Ajah', localGovernment: 'Eti-Osa', coordinates: [3.5777, 6.4698] },
        { name: 'Festac', localGovernment: 'Amuwo-Odofin', coordinates: [3.2833, 6.4667] },
        { name: 'Oshodi', localGovernment: 'Oshodi-Isolo', coordinates: [3.3408, 6.5564] },
        { name: 'Maryland', localGovernment: 'Kosofe', coordinates: [3.3681, 6.5714] },
        { name: 'Gbagada', localGovernment: 'Kosofe', coordinates: [3.3922, 6.5539] },
        { name: 'Magodo', localGovernment: 'Kosofe', coordinates: [3.3833, 6.6167] },
        { name: 'Ogba', localGovernment: 'Ikeja', coordinates: [3.3425, 6.6183] },
        { name: 'Ikorodu', localGovernment: 'Ikorodu', coordinates: [3.5100, 6.6194] },
      ],
      FC: [
        { name: 'Garki', localGovernment: 'AMAC', coordinates: [7.4892, 9.0312] },
        { name: 'Wuse', localGovernment: 'AMAC', coordinates: [7.4675, 9.0678] },
        { name: 'Maitama', localGovernment: 'AMAC', coordinates: [7.4925, 9.0881] },
        { name: 'Asokoro', localGovernment: 'AMAC', coordinates: [7.5306, 9.0531] },
        { name: 'Gwarinpa', localGovernment: 'Bwari', coordinates: [7.4000, 9.1167] },
        { name: 'Kubwa', localGovernment: 'Bwari', coordinates: [7.3167, 9.1500] },
        { name: 'Lugbe', localGovernment: 'AMAC', coordinates: [7.3833, 8.9833] },
        { name: 'Nyanya', localGovernment: 'Nasarawa', coordinates: [7.5500, 9.0167] },
        { name: 'Jabi', localGovernment: 'AMAC', coordinates: [7.4247, 9.0728] },
        { name: 'Utako', localGovernment: 'AMAC', coordinates: [7.4397, 9.0764] },
      ],
      RI: [
        { name: 'Port Harcourt', localGovernment: 'Port Harcourt', coordinates: [7.0134, 4.8156] },
        { name: 'GRA Phase 1', localGovernment: 'Obio-Akpor', coordinates: [6.9903, 4.8239] },
        { name: 'GRA Phase 2', localGovernment: 'Obio-Akpor', coordinates: [6.9850, 4.8350] },
        { name: 'Rumuola', localGovernment: 'Obio-Akpor', coordinates: [6.9939, 4.8447] },
        { name: 'Rumuokwuta', localGovernment: 'Obio-Akpor', coordinates: [6.9917, 4.8553] },
        { name: 'Trans Amadi', localGovernment: 'Obio-Akpor', coordinates: [7.0333, 4.7833] },
        { name: 'Elelenwo', localGovernment: 'Obio-Akpor', coordinates: [7.0500, 4.8333] },
        { name: 'Choba', localGovernment: 'Obio-Akpor', coordinates: [6.9167, 4.8833] },
      ],
      KN: [
        { name: 'Kano Municipal', localGovernment: 'Kano Municipal', coordinates: [8.5200, 12.0000] },
        { name: 'Sabon Gari', localGovernment: 'Fagge', coordinates: [8.5167, 11.9833] },
        { name: 'Tarauni', localGovernment: 'Tarauni', coordinates: [8.5333, 11.9667] },
        { name: 'Nassarawa', localGovernment: 'Nassarawa', coordinates: [8.5500, 11.9500] },
        { name: 'Gwale', localGovernment: 'Gwale', coordinates: [8.5000, 12.0167] },
      ],
      OY: [
        { name: 'Ibadan North', localGovernment: 'Ibadan North', coordinates: [3.9000, 7.4000] },
        { name: 'Ibadan South', localGovernment: 'Ibadan South East', coordinates: [3.8833, 7.3667] },
        { name: 'Bodija', localGovernment: 'Ibadan North', coordinates: [3.9167, 7.4167] },
        { name: 'Challenge', localGovernment: 'Ibadan South East', coordinates: [3.8500, 7.3833] },
        { name: 'Ring Road', localGovernment: 'Ibadan South West', coordinates: [3.8667, 7.3833] },
        { name: 'Dugbe', localGovernment: 'Ibadan North West', coordinates: [3.8833, 7.3833] },
      ],
    };
  }

  async seed(): Promise<Area[]> {
    this.logger.log('Seeding areas...');
    const areasData = this.getAreasData();
    const createdAreas: Area[] = [];

    for (const [stateCode, areas] of Object.entries(areasData)) {
      const state = await this.stateModel.findOne({ code: stateCode });
      if (!state) {
        this.logger.warn(`State not found: ${stateCode}`);
        continue;
      }

      for (const areaData of areas) {
        const exists = await this.areaModel.findOne({
          name: areaData.name,
          stateId: state._id,
        });

        if (!exists) {
          const area = await this.areaModel.create({
            name: areaData.name,
            stateId: state._id,
            localGovernment: areaData.localGovernment,
            location: {
              type: 'Point',
              coordinates: areaData.coordinates,
            },
            isActive: true,
          });
          createdAreas.push(area);
          this.logger.log(`Created area: ${areaData.name} in ${state.name}`);
        }
      }
    }

    this.logger.log(`Areas seeding complete. Created ${createdAreas.length} areas.`);
    return createdAreas;
  }
}
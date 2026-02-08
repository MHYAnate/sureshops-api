import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { State } from '../../states/schemas/state.schema';

@Injectable()
export class StatesSeeder {
  private readonly logger = new Logger(StatesSeeder.name);

  constructor(@InjectModel(State.name) private stateModel: Model<State>) {}

  private getNigerianStates() {
    return [
      { name: 'Abia', code: 'AB', capital: 'Umuahia', coordinates: [7.5248, 5.5320] },
      { name: 'Adamawa', code: 'AD', capital: 'Yola', coordinates: [12.4634, 9.3265] },
      { name: 'Akwa Ibom', code: 'AK', capital: 'Uyo', coordinates: [7.9304, 5.0377] },
      { name: 'Anambra', code: 'AN', capital: 'Awka', coordinates: [7.0068, 6.2209] },
      { name: 'Bauchi', code: 'BA', capital: 'Bauchi', coordinates: [9.8442, 10.3158] },
      { name: 'Bayelsa', code: 'BY', capital: 'Yenagoa', coordinates: [6.2638, 4.9316] },
      { name: 'Benue', code: 'BE', capital: 'Makurdi', coordinates: [8.5391, 7.7322] },
      { name: 'Borno', code: 'BO', capital: 'Maiduguri', coordinates: [13.1510, 11.8333] },
      { name: 'Cross River', code: 'CR', capital: 'Calabar', coordinates: [8.3417, 4.9757] },
      { name: 'Delta', code: 'DE', capital: 'Asaba', coordinates: [6.7540, 6.1981] },
      { name: 'Ebonyi', code: 'EB', capital: 'Abakaliki', coordinates: [8.1137, 6.3249] },
      { name: 'Edo', code: 'ED', capital: 'Benin City', coordinates: [5.6145, 6.3350] },
      { name: 'Ekiti', code: 'EK', capital: 'Ado-Ekiti', coordinates: [5.2194, 7.6256] },
      { name: 'Enugu', code: 'EN', capital: 'Enugu', coordinates: [7.4951, 6.4584] },
      { name: 'FCT', code: 'FC', capital: 'Abuja', coordinates: [7.4951, 9.0579] },
      { name: 'Gombe', code: 'GO', capital: 'Gombe', coordinates: [11.1728, 10.2897] },
      { name: 'Imo', code: 'IM', capital: 'Owerri', coordinates: [7.0352, 5.4836] },
      { name: 'Jigawa', code: 'JI', capital: 'Dutse', coordinates: [9.3399, 11.7574] },
      { name: 'Kaduna', code: 'KD', capital: 'Kaduna', coordinates: [7.4388, 10.5105] },
      { name: 'Kano', code: 'KN', capital: 'Kano', coordinates: [8.5364, 11.9964] },
      { name: 'Katsina', code: 'KT', capital: 'Katsina', coordinates: [7.6006, 13.0059] },
      { name: 'Kebbi', code: 'KE', capital: 'Birnin Kebbi', coordinates: [4.1994, 12.4539] },
      { name: 'Kogi', code: 'KO', capital: 'Lokoja', coordinates: [6.7429, 7.8023] },
      { name: 'Kwara', code: 'KW', capital: 'Ilorin', coordinates: [4.5418, 8.4966] },
      { name: 'Lagos', code: 'LA', capital: 'Ikeja', coordinates: [3.3792, 6.5244] },
      { name: 'Nasarawa', code: 'NA', capital: 'Lafia', coordinates: [8.5200, 8.5200] },
      { name: 'Niger', code: 'NI', capital: 'Minna', coordinates: [6.5569, 9.6139] },
      { name: 'Ogun', code: 'OG', capital: 'Abeokuta', coordinates: [3.3515, 7.1604] },
      { name: 'Ondo', code: 'ON', capital: 'Akure', coordinates: [5.1950, 7.2526] },
      { name: 'Osun', code: 'OS', capital: 'Osogbo', coordinates: [4.5624, 7.7827] },
      { name: 'Oyo', code: 'OY', capital: 'Ibadan', coordinates: [3.8963, 7.3775] },
      { name: 'Plateau', code: 'PL', capital: 'Jos', coordinates: [8.8921, 9.8965] },
      { name: 'Rivers', code: 'RI', capital: 'Port Harcourt', coordinates: [7.0134, 4.8156] },
      { name: 'Sokoto', code: 'SO', capital: 'Sokoto', coordinates: [5.2476, 13.0533] },
      { name: 'Taraba', code: 'TA', capital: 'Jalingo', coordinates: [11.3596, 8.8929] },
      { name: 'Yobe', code: 'YO', capital: 'Damaturu', coordinates: [11.9610, 11.7480] },
      { name: 'Zamfara', code: 'ZA', capital: 'Gusau', coordinates: [6.6542, 12.1628] },
    ];
  }

  async seed(): Promise<State[]> {
    this.logger.log('Seeding Nigerian states...');
    const states = this.getNigerianStates();
    const createdStates: State[] = [];

    for (const stateData of states) {
      const exists = await this.stateModel.findOne({ code: stateData.code });
      if (!exists) {
        const state = await this.stateModel.create({
          name: stateData.name,
          code: stateData.code,
          capital: stateData.capital,
          location: {
            type: 'Point',
            coordinates: stateData.coordinates,
          },
          isActive: true,
        });
        createdStates.push(state);
        this.logger.log(`Created state: ${stateData.name}`);
      }
    }

    this.logger.log(`States seeding complete. Created ${createdStates.length} states.`);
    return createdStates;
  }

  async getStateByCode(code: string): Promise<State | null> {
    return this.stateModel.findOne({ code });
  }
}
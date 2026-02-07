import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { State } from './schemas/state.schema';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';

@Injectable()
export class StatesService {
  constructor(@InjectModel(State.name) private stateModel: Model<State>) {}

  async create(dto: CreateStateDto): Promise<State> {
    const exists = await this.stateModel.findOne({
      $or: [{ name: dto.name }, { code: dto.code }],
    });
    if (exists) {
      throw new ConflictException('State already exists');
    }

    const stateData: any = { ...dto };
    if (dto.coordinates) {
      stateData.location = {
        type: 'Point',
        coordinates: dto.coordinates,
      };
    }
    delete stateData.coordinates;

    return this.stateModel.create(stateData);
  }

  async findAll(): Promise<State[]> {
    return this.stateModel.find({ isActive: true }).sort({ name: 1 });
  }

  async findById(id: string): Promise<State> {
    const state = await this.stateModel.findById(id);
    if (!state) {
      throw new NotFoundException('State not found');
    }
    return state;
  }

  async findByCode(code: string): Promise<State> {
    const state = await this.stateModel.findOne({ code: code.toUpperCase() });
    if (!state) {
      throw new NotFoundException('State not found');
    }
    return state;
  }

  async update(id: string, dto: UpdateStateDto): Promise<State> {
    const updateData: any = { ...dto };
    if (dto.coordinates) {
      updateData.location = {
        type: 'Point',
        coordinates: dto.coordinates,
      };
    }
    delete updateData.coordinates;

    const state = await this.stateModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!state) {
      throw new NotFoundException('State not found');
    }
    return state;
  }

  async delete(id: string): Promise<void> {
    const result = await this.stateModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException('State not found');
    }
  }

  async seedNigerianStates(): Promise<State[]> {
    const nigerianStates = [
      { name: 'Abia', code: 'AB', capital: 'Umuahia' },
      { name: 'Adamawa', code: 'AD', capital: 'Yola' },
      { name: 'Akwa Ibom', code: 'AK', capital: 'Uyo' },
      { name: 'Anambra', code: 'AN', capital: 'Awka' },
      { name: 'Bauchi', code: 'BA', capital: 'Bauchi' },
      { name: 'Bayelsa', code: 'BY', capital: 'Yenagoa' },
      { name: 'Benue', code: 'BE', capital: 'Makurdi' },
      { name: 'Borno', code: 'BO', capital: 'Maiduguri' },
      { name: 'Cross River', code: 'CR', capital: 'Calabar' },
      { name: 'Delta', code: 'DE', capital: 'Asaba' },
      { name: 'Ebonyi', code: 'EB', capital: 'Abakaliki' },
      { name: 'Edo', code: 'ED', capital: 'Benin City' },
      { name: 'Ekiti', code: 'EK', capital: 'Ado-Ekiti' },
      { name: 'Enugu', code: 'EN', capital: 'Enugu' },
      { name: 'FCT', code: 'FC', capital: 'Abuja' },
      { name: 'Gombe', code: 'GO', capital: 'Gombe' },
      { name: 'Imo', code: 'IM', capital: 'Owerri' },
      { name: 'Jigawa', code: 'JI', capital: 'Dutse' },
      { name: 'Kaduna', code: 'KD', capital: 'Kaduna' },
      { name: 'Kano', code: 'KN', capital: 'Kano' },
      { name: 'Katsina', code: 'KT', capital: 'Katsina' },
      { name: 'Kebbi', code: 'KE', capital: 'Birnin Kebbi' },
      { name: 'Kogi', code: 'KO', capital: 'Lokoja' },
      { name: 'Kwara', code: 'KW', capital: 'Ilorin' },
      { name: 'Lagos', code: 'LA', capital: 'Ikeja' },
      { name: 'Nasarawa', code: 'NA', capital: 'Lafia' },
      { name: 'Niger', code: 'NI', capital: 'Minna' },
      { name: 'Ogun', code: 'OG', capital: 'Abeokuta' },
      { name: 'Ondo', code: 'ON', capital: 'Akure' },
      { name: 'Osun', code: 'OS', capital: 'Osogbo' },
      { name: 'Oyo', code: 'OY', capital: 'Ibadan' },
      { name: 'Plateau', code: 'PL', capital: 'Jos' },
      { name: 'Rivers', code: 'RI', capital: 'Port Harcourt' },
      { name: 'Sokoto', code: 'SO', capital: 'Sokoto' },
      { name: 'Taraba', code: 'TA', capital: 'Jalingo' },
      { name: 'Yobe', code: 'YO', capital: 'Damaturu' },
      { name: 'Zamfara', code: 'ZA', capital: 'Gusau' },
    ];

    const createdStates: State[] = [];
    for (const stateData of nigerianStates) {
      const exists = await this.stateModel.findOne({ code: stateData.code });
      if (!exists) {
        const state = await this.stateModel.create(stateData);
        createdStates.push(state);
      }
    }
    return createdStates;
  }
}
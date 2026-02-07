import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Area } from './schemas/area.schema';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Injectable()
export class AreasService {
  constructor(@InjectModel(Area.name) private areaModel: Model<Area>) {}

  async create(dto: CreateAreaDto): Promise<Area> {
    const areaData: any = { ...dto };
    if (dto.coordinates) {
      areaData.location = {
        type: 'Point',
        coordinates: dto.coordinates,
      };
    }
    delete areaData.coordinates;
    return this.areaModel.create(areaData);
  }

  async findAll(): Promise<Area[]> {
    return this.areaModel
      .find({ isActive: true })
      .populate('stateId', 'name code')
      .sort({ name: 1 });
  }

  async findByState(stateId: string): Promise<Area[]> {
    return this.areaModel
      .find({ stateId, isActive: true })
      .populate('stateId', 'name code')
      .sort({ name: 1 });
  }

  async findById(id: string): Promise<Area> {
    const area = await this.areaModel
      .findById(id)
      .populate('stateId', 'name code');
    if (!area) {
      throw new NotFoundException('Area not found');
    }
    return area;
  }

  async findNearby(
    longitude: number,
    latitude: number,
    maxDistanceKm: number = 10,
  ): Promise<Area[]> {
    return this.areaModel.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistanceKm * 1000,
        },
      },
      isActive: true,
    }).populate('stateId', 'name code');
  }

  async update(id: string, dto: UpdateAreaDto): Promise<Area> {
    const updateData: any = { ...dto };
    if (dto.coordinates) {
      updateData.location = {
        type: 'Point',
        coordinates: dto.coordinates,
      };
    }
    delete updateData.coordinates;

    const area = await this.areaModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('stateId', 'name code');
    if (!area) {
      throw new NotFoundException('Area not found');
    }
    return area;
  }

  async delete(id: string): Promise<void> {
    const result = await this.areaModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Area not found');
    }
  }
}
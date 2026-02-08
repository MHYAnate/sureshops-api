import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Market } from '../../markets/schemas/market.schema';
import { Area } from '../../areas/schemas/area.schema';
import { State } from '../../states/schemas/state.schema';
import { MarketType } from '../../common/enums/market-type.enum';

// ✅ Add this interface
interface MarketSeedData {
  name: string;
  type: MarketType;
  address: string;
  landmark?: string;          // optional
  openingTime: string;
  closingTime: string;
  operatingDays?: string[];   // optional
}

interface LocationSeedData {
  stateCode: string;
  areaName: string;
  markets: MarketSeedData[];
}

@Injectable()
export class MarketsSeeder {
  private readonly logger = new Logger(MarketsSeeder.name);

  constructor(
    @InjectModel(Market.name) private marketModel: Model<Market>,
    @InjectModel(Area.name) private areaModel: Model<Area>,
    @InjectModel(State.name) private stateModel: Model<State>,
  ) {}

  // ✅ Explicitly type the return value
  private getMarketsData(): LocationSeedData[] {
    return [
      // Lagos Markets
      {
        stateCode: 'LA',
        areaName: 'Ikeja',
        markets: [
          {
            name: 'Computer Village',
            type: MarketType.TRADITIONAL_MARKET,
            address: 'Ikeja, Lagos',
            landmark: 'Near Ikeja City Mall',
            openingTime: '08:00',
            closingTime: '18:00',
            operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          },
          {
            name: 'Ikeja City Mall',
            type: MarketType.SHOPPING_MALL,
            address: 'Alausa, Ikeja, Lagos',
            landmark: 'Opposite Lagos State Secretariat',
            openingTime: '09:00',
            closingTime: '21:00',
            operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          },
        ],
      },
      {
        stateCode: 'LA',
        areaName: 'Lekki',
        markets: [
          {
            name: 'The Palms Shopping Mall',
            type: MarketType.SHOPPING_MALL,
            address: 'Lekki Phase 1, Lagos',
            landmark: 'Lekki Expressway',
            openingTime: '09:00',
            closingTime: '21:00',
            operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          },
          {
            name: 'Circle Mall Lekki',
            type: MarketType.SHOPPING_MALL,
            address: 'Lekki, Lagos',
            openingTime: '09:00',
            closingTime: '21:00',
            // landmark and operatingDays omitted — now fine because they're optional
          },
        ],
      },
      {
        stateCode: 'LA',
        areaName: 'Victoria Island',
        markets: [
          {
            name: 'Mega Plaza',
            type: MarketType.PLAZA,
            address: 'Victoria Island, Lagos',
            openingTime: '08:00',
            closingTime: '20:00',
          },
        ],
      },
      {
        stateCode: 'LA',
        areaName: 'Lagos Island',
        markets: [
          {
            name: 'Balogun Market',
            type: MarketType.TRADITIONAL_MARKET,
            address: 'Lagos Island',
            landmark: 'Near Tinubu Square',
            openingTime: '06:00',
            closingTime: '19:00',
            operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          },
          {
            name: 'Idumota Market',
            type: MarketType.TRADITIONAL_MARKET,
            address: 'Lagos Island',
            openingTime: '06:00',
            closingTime: '19:00',
          },
        ],
      },
      {
        stateCode: 'LA',
        areaName: 'Yaba',
        markets: [
          {
            name: 'Yaba Market',
            type: MarketType.TRADITIONAL_MARKET,
            address: 'Yaba, Lagos',
            openingTime: '07:00',
            closingTime: '18:00',
          },
          {
            name: 'Tejuosho Market',
            type: MarketType.TRADITIONAL_MARKET,
            address: 'Yaba, Lagos',
            openingTime: '07:00',
            closingTime: '18:00',
          },
        ],
      },
      // FCT Markets
      {
        stateCode: 'FC',
        areaName: 'Wuse',
        markets: [
          {
            name: 'Wuse Market',
            type: MarketType.TRADITIONAL_MARKET,
            address: 'Wuse Zone 5, Abuja',
            openingTime: '07:00',
            closingTime: '18:00',
          },
          {
            name: 'Ceddi Plaza',
            type: MarketType.PLAZA,
            address: 'Wuse Zone 4, Abuja',
            openingTime: '09:00',
            closingTime: '20:00',
          },
        ],
      },
      {
        stateCode: 'FC',
        areaName: 'Garki',
        markets: [
          {
            name: 'Garki Model Market',
            type: MarketType.TRADITIONAL_MARKET,
            address: 'Area 10, Garki, Abuja',
            openingTime: '07:00',
            closingTime: '18:00',
          },
        ],
      },
      {
        stateCode: 'FC',
        areaName: 'Jabi',
        markets: [
          {
            name: 'Jabi Lake Mall',
            type: MarketType.SHOPPING_MALL,
            address: 'Jabi District, Abuja',
            openingTime: '09:00',
            closingTime: '21:00',
            operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          },
        ],
      },
      // Rivers Markets
      {
        stateCode: 'RI',
        areaName: 'Port Harcourt',
        markets: [
          {
            name: 'Mile 1 Market',
            type: MarketType.TRADITIONAL_MARKET,
            address: 'Mile 1, Port Harcourt',
            openingTime: '07:00',
            closingTime: '18:00',
          },
          {
            name: 'Mile 3 Market',
            type: MarketType.TRADITIONAL_MARKET,
            address: 'Mile 3, Port Harcourt',
            openingTime: '07:00',
            closingTime: '18:00',
          },
          {
            name: 'Port Harcourt Mall',
            type: MarketType.SHOPPING_MALL,
            address: 'Azikiwe Road, Port Harcourt',
            openingTime: '09:00',
            closingTime: '21:00',
          },
        ],
      },
      // Kano Markets
      {
        stateCode: 'KN',
        areaName: 'Kano Municipal',
        markets: [
          {
            name: 'Kurmi Market',
            type: MarketType.TRADITIONAL_MARKET,
            address: 'Kano City',
            openingTime: '07:00',
            closingTime: '18:00',
          },
          {
            name: 'Singer Market',
            type: MarketType.TRADITIONAL_MARKET,
            address: 'Kano City',
            openingTime: '07:00',
            closingTime: '18:00',
          },
        ],
      },
      {
        stateCode: 'KN',
        areaName: 'Sabon Gari',
        markets: [
          {
            name: 'Sabon Gari Market',
            type: MarketType.TRADITIONAL_MARKET,
            address: 'Sabon Gari, Kano',
            openingTime: '07:00',
            closingTime: '18:00',
          },
        ],
      },
      // Oyo Markets
      {
        stateCode: 'OY',
        areaName: 'Ibadan North',
        markets: [
          {
            name: 'Bodija Market',
            type: MarketType.TRADITIONAL_MARKET,
            address: 'Bodija, Ibadan',
            openingTime: '06:00',
            closingTime: '18:00',
          },
          {
            name: 'Palms Mall Ibadan',
            type: MarketType.SHOPPING_MALL,
            address: 'Ring Road, Ibadan',
            openingTime: '09:00',
            closingTime: '21:00',
          },
        ],
      },
      {
        stateCode: 'OY',
        areaName: 'Dugbe',
        markets: [
          {
            name: 'Dugbe Market',
            type: MarketType.TRADITIONAL_MARKET,
            address: 'Dugbe, Ibadan',
            openingTime: '06:00',
            closingTime: '18:00',
          },
        ],
      },
    ];
  }

  async seed(): Promise<Market[]> {
    this.logger.log('Seeding markets...');
    const marketsData = this.getMarketsData();
    const createdMarkets: Market[] = [];

    for (const location of marketsData) {
      const state = await this.stateModel.findOne({ code: location.stateCode });
      if (!state) continue;

      const area = await this.areaModel.findOne({
        name: location.areaName,
        stateId: state._id,
      });
      if (!area) continue;

      for (const marketData of location.markets) {
        const exists = await this.marketModel.findOne({
          name: marketData.name,
          areaId: area._id,
        });

        if (!exists) {
          const market = await this.marketModel.create({
            name: marketData.name,
            type: marketData.type,
            stateId: state._id,
            areaId: area._id,
            address: marketData.address,
            landmark: marketData.landmark,           // ✅ No more error
            openingTime: marketData.openingTime,
            closingTime: marketData.closingTime,
            operatingDays: marketData.operatingDays || [
              'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
            ],
            isActive: true,
          });
          createdMarkets.push(market);
          this.logger.log(`Created market: ${marketData.name}`);
        }
      }
    }

    this.logger.log(`Markets seeding complete. Created ${createdMarkets.length} markets.`);
    return createdMarkets;
  }
}
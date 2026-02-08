import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CatalogItem } from '../../catalog/schemas/catalog-item.schema';

@Injectable()
export class CategoriesSeeder {
  private readonly logger = new Logger(CategoriesSeeder.name);

  constructor(
    @InjectModel(CatalogItem.name) private catalogModel: Model<CatalogItem>,
  ) {}

  private getCategories() {
    return [
      {
        category: 'Electronics',
        subcategories: ['Phones', 'Laptops', 'TVs', 'Audio', 'Cameras', 'Accessories', 'Gaming'],
        items: [
          { name: 'iPhone 15 Pro Max', brand: 'Apple', tags: ['smartphone', 'apple', 'ios'] },
          { name: 'iPhone 15 Pro', brand: 'Apple', tags: ['smartphone', 'apple', 'ios'] },
          { name: 'iPhone 15', brand: 'Apple', tags: ['smartphone', 'apple', 'ios'] },
          { name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', tags: ['smartphone', 'android', 'samsung'] },
          { name: 'Samsung Galaxy S24', brand: 'Samsung', tags: ['smartphone', 'android'] },
          { name: 'MacBook Pro 16', brand: 'Apple', tags: ['laptop', 'apple', 'macbook'] },
          { name: 'MacBook Air M3', brand: 'Apple', tags: ['laptop', 'apple', 'macbook'] },
          { name: 'HP Pavilion', brand: 'HP', tags: ['laptop', 'windows'] },
          { name: 'Dell XPS 15', brand: 'Dell', tags: ['laptop', 'windows'] },
          { name: 'PlayStation 5', brand: 'Sony', tags: ['gaming', 'console', 'ps5'] },
          { name: 'Xbox Series X', brand: 'Microsoft', tags: ['gaming', 'console', 'xbox'] },
          { name: 'Nintendo Switch', brand: 'Nintendo', tags: ['gaming', 'console'] },
          { name: 'AirPods Pro', brand: 'Apple', tags: ['audio', 'earbuds', 'wireless'] },
          { name: 'Sony WH-1000XM5', brand: 'Sony', tags: ['audio', 'headphones', 'wireless'] },
          { name: 'Samsung 55" QLED TV', brand: 'Samsung', tags: ['tv', 'smart tv'] },
          { name: 'LG 65" OLED TV', brand: 'LG', tags: ['tv', 'smart tv', 'oled'] },
        ],
      },
      {
        category: 'Fashion',
        subcategories: ['Men', 'Women', 'Kids', 'Shoes', 'Bags', 'Accessories', 'Jewelry'],
        items: [
          { name: 'Nike Air Jordan 1', brand: 'Nike', tags: ['shoes', 'sneakers', 'jordan'] },
          { name: 'Adidas Yeezy Boost 350', brand: 'Adidas', tags: ['shoes', 'sneakers', 'yeezy'] },
          { name: 'Louis Vuitton Neverfull', brand: 'Louis Vuitton', tags: ['bag', 'luxury'] },
          { name: 'Gucci GG Marmont', brand: 'Gucci', tags: ['bag', 'luxury'] },
          { name: 'Rolex Submariner', brand: 'Rolex', tags: ['watch', 'luxury'] },
          { name: 'Apple Watch Series 9', brand: 'Apple', tags: ['watch', 'smartwatch'] },
        ],
      },
      {
        category: 'Home & Garden',
        subcategories: ['Furniture', 'Kitchen', 'Bedroom', 'Bathroom', 'Garden', 'Decor'],
        items: [
          { name: 'Dyson V15 Vacuum', brand: 'Dyson', tags: ['appliance', 'cleaning'] },
          { name: 'Samsung French Door Refrigerator', brand: 'Samsung', tags: ['appliance', 'kitchen'] },
          { name: 'LG Washing Machine', brand: 'LG', tags: ['appliance', 'laundry'] },
          { name: 'KitchenAid Stand Mixer', brand: 'KitchenAid', tags: ['appliance', 'kitchen', 'baking'] },
        ],
      },
      {
        category: 'Health & Beauty',
        subcategories: ['Skincare', 'Makeup', 'Haircare', 'Fragrance', 'Personal Care', 'Supplements'],
        items: [
          { name: 'La Mer Moisturizing Cream', brand: 'La Mer', tags: ['skincare', 'luxury'] },
          { name: 'Chanel No. 5', brand: 'Chanel', tags: ['fragrance', 'perfume'] },
          { name: 'Dior Sauvage', brand: 'Dior', tags: ['fragrance', 'cologne'] },
          { name: 'MAC Ruby Woo Lipstick', brand: 'MAC', tags: ['makeup', 'lipstick'] },
        ],
      },
      {
        category: 'Sports & Outdoors',
        subcategories: ['Fitness', 'Outdoor', 'Team Sports', 'Water Sports', 'Cycling'],
        items: [
          { name: 'Peloton Bike+', brand: 'Peloton', tags: ['fitness', 'cycling', 'exercise'] },
          { name: 'Nike Dri-FIT Running Shoes', brand: 'Nike', tags: ['shoes', 'running', 'sports'] },
          { name: 'Adidas Football', brand: 'Adidas', tags: ['football', 'soccer', 'ball'] },
        ],
      },
    ];
  }

  async seed(): Promise<CatalogItem[]> {
    this.logger.log('Seeding categories and catalog items...');
    const categories = this.getCategories();
    const createdItems: CatalogItem[] = [];

    for (const cat of categories) {
      for (const item of cat.items) {
        const exists = await this.catalogModel.findOne({ name: item.name });
        if (!exists) {
          const catalogItem = await this.catalogModel.create({
            name: item.name,
            brand: item.brand,
            category: cat.category,
            tags: item.tags,
            isActive: true,
          });
          createdItems.push(catalogItem);
          this.logger.log(`Created catalog item: ${item.name}`);
        }
      }
    }

    this.logger.log(`Categories seeding complete. Created ${createdItems.length} items.`);
    return createdItems;
  }
}
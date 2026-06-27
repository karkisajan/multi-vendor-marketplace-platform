import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProductImage } from '../entities/product-image.entity';

@Injectable()
export class ProductImageRepository extends Repository<ProductImage> {
  constructor(dataSource: DataSource) {
    super(ProductImage, dataSource.createEntityManager());
  }

  // Add custom methods below
}

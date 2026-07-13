import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProductRating } from '../entities/product-rating.entity';

@Injectable()
export class ProductRatingRepository extends Repository<ProductRating> {
  constructor(dataSource: DataSource) {
    super(ProductRating, dataSource.createEntityManager());
  }
}

import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProductSpecification } from '../entities/product-specification.entity';

@Injectable()
export class ProductSpecificationRepository extends Repository<ProductSpecification> {
  constructor(dataSource: DataSource) {
    super(ProductSpecification, dataSource.createEntityManager());
  }

  /**
   * Finds a product specification by its primary key, including its related product.
   */
  async findSpecificationById(
    id: string,
  ): Promise<ProductSpecification | null> {
    return this.findOne({
      where: { id },
      relations: ['product'],
    });
  }

  /**
   * Finds all specifications for a given product ID, sorted by sortOrder ASC.
   */
  async findSpecificationsByProductId(
    productId: string,
  ): Promise<ProductSpecification[]> {
    return this.find({
      where: { productId },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * Creates and persists a new specification linked to a product.
   */
  async createSpecification(
    specificationData: Partial<ProductSpecification>,
  ): Promise<ProductSpecification> {
    const spec = this.create(specificationData);
    return await this.save(spec);
  }

  /**
   * Updates an existing specification by ID with the provided partial data.
   */
  async updateSpecification(
    id: string,
    updateData: Partial<ProductSpecification>,
  ): Promise<ProductSpecification | null> {
    await this.update(id, updateData);
    return await this.findOne({ where: { id } });
  }
}

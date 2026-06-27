import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProductVariant } from '../entities/product-variant.entity';

@Injectable()
export class ProductVariantRepository extends Repository<ProductVariant> {
  constructor(dataSource: DataSource) {
    super(ProductVariant, dataSource.createEntityManager());
  }

  /**
   * Finds a variant by its primary key.
   */
  async findVariantById(id: string): Promise<ProductVariant | null> {
    return this.findOne({
      where: { id },
      relations: ['product'],
    });
  }

  /**
   * Counts the number of active (non-soft-deleted) variants for a given product.
   */
  async countVariantsByProductId(productId: string): Promise<number> {
    return this.count({ where: { productId: productId } });
  }

  /**
   * Creates and persists a new variant linked to a product.
   */
  async createVariant(
    variantData: Partial<ProductVariant>,
  ): Promise<ProductVariant> {
    const variant = this.create(variantData);
    return await this.save(variant);
  }

  /**
   * Updates an existing variant by ID with the provided partial data.
   */
  async updateVariant(
    id: string,
    updateData: Partial<ProductVariant>,
  ): Promise<ProductVariant | null> {
    await this.update(id, updateData);
    return await this.findVariantById(id);
  }
}

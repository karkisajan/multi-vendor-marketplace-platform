import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductStatusEnum } from 'src/common/enums/product-status.enum';

@Injectable()
export class ProductRepository extends Repository<Product> {
  constructor(dataSource: DataSource) {
    super(Product, dataSource.createEntityManager());
  }

  /**
   * Finds a product by its primary key, including related variants.
   */
  async findProductById(id: string): Promise<Product | null> {
    return this.findOne({
      where: { id },
      relations: ['productVariants'],
    });
  }

  /**
   * Finds a product by its slug to ensure uniqueness during create/update.
   */
  async findProductBySlug(slug: string): Promise<Product | null> {
    return await this.findOne({ where: { slug: slug } });
  }

  /**
   * Finds a product owned by a specific vendor, including related variants.
   */
  async findProductByIdAndVendor(
    id: string,
    vendorId: string,
  ): Promise<Product | null> {
    return this.findOne({
      where: { id, vendorId },
      relations: ['productVariants'],
    });
  }

  /**
   * Creates and persists a new product with DRAFT status by default.
   */
  async createProduct(
    createProductDto: CreateProductDto,
    vendorId: string,
    slug: string,
  ): Promise<Product> {
    const product = this.create({
      name: createProductDto.name,
      description: createProductDto.description,
      categoryId: createProductDto.categoryId,
      vendorId: vendorId,
      slug: slug,
      status: ProductStatusEnum.DRAFT,
    });
    return await this.save(product);
  }

  /**
   * Updates an existing product by ID with the provided partial data.
   */
  async updateProduct(
    id: string,
    updateData: Partial<Product>,
  ): Promise<Product | null> {
    await this.update(id, updateData);
    return await this.findProductById(id);
  }
}

import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';
import { UpdateProductStatusDto } from '../dto/admin/update-product-status.dto';
import { AdminUpdateProductDto } from '../dto/admin/admin-update-product.dto';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { generateSlug } from 'src/common/utils/generate-slug.util';
import { CurrentUserContext } from 'src/modules/users/types/user.types';
import { normalizePagination } from 'src/common/utils/validate-pagination.util';
import { ProductStatusEnum } from 'src/common/enums/product-status.enum';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { randomUUID } from 'crypto';
import { ProductImage } from '../entities/product-image.entity';

@Injectable()
export class AdminProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Reads the current category cache namespace version; defaults to version 1
   * so read endpoints can build stable keys before any mutation has occurred.
   */
  private async getProductCachedVersion(): Promise<string> {
    const version = await this.cacheManager.get<string>('products:version');
    return String(version);
  }

  /**
   * Advances the category cache namespace after create, update, or delete.
   * Existing list/tree entries stay in Redis until TTL expiry, while new reads use a unique token.
   */
  private async invalidateCachedProductsVersion(): Promise<void> {
    await this.cacheManager.set('products:version', randomUUID);
  }

  /**
   * Retrieves a paginated list of all products in the system for administrative purposes.
   * Allows filtering by search term (matching product name or vendor business name),
   * category ID, and product status.
   */
  async getAllProductsAdmin({
    page,
    limit,
    search,
    categoryId,
    status,
  }: {
    page: number;
    limit: number;
    search?: string;
    categoryId?: string;
    status?: ProductStatusEnum;
  }) {
    const {
      normalizedPage,
      normalizedLimit,
    }: { normalizedPage: number; normalizedLimit: number } =
      normalizePagination(page, limit);

    const version: string = await this.getProductCachedVersion();
    const cacheKey: string = `products:admin:v${version}:${JSON.stringify({
      page: normalizedPage,
      limit: normalizedLimit,
      search: search ?? '',
      categoryId: categoryId ?? '',
      status: status ?? '',
    })}`;
    const cachedProductsData = await this.cacheManager.get(cacheKey);
    if (cachedProductsData) return cachedProductsData;

    const productBaseQuery = this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.category', 'category')
      .leftJoin('product.user', 'vendor')
      .leftJoin('vendor.vendorProfile', 'vendorProfile')
      .select([
        'product.id',
        'product.name',
        'product.description',
        'product.status',
        'product.createdAt',
        'vendor.id',
        'vendorProfile.id',
        'vendorProfile.businessName',
        'category.id',
        'category.name',
      ]);

    if (search?.trim()) {
      productBaseQuery.andWhere(
        `(product.name ILIKE :search OR product.description ILIKE :search 
          OR vendorProfile.businessName ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    if (status) {
      productBaseQuery.andWhere('product.status = :status', { status: status });
    }

    if (categoryId) {
      productBaseQuery.andWhere('category.id = :categoryId', {
        categoryId: categoryId,
      });
    }

    const [productsData, totalProductsData]: [Product[], number] =
      await productBaseQuery
        .skip((normalizedPage - 1) * normalizedLimit)
        .take(normalizedLimit)
        .orderBy('product.createdAt', 'DESC')
        .getManyAndCount();

    const refinedProductsResponseData = productsData.map(
      (product: Product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        status: product.status,
        vendorProfile: {
          id: product.user.id,
          businessName: product.user.vendorProfile.businessName,
        },
        category: {
          id: product.category.id,
          name: product.category.name,
        },
      }),
    );

    const result =
      refinedProductsResponseData.length === 0
        ? {
            message: 'No products found',
            data: [],
            meta: {
              page: normalizedPage,
              limit: normalizedLimit,
              totalPages: Math.ceil(totalProductsData / normalizedLimit),
              total: totalProductsData,
            },
          }
        : {
            message: 'Products fetched successfully.',
            data: refinedProductsResponseData,
            meta: {
              page: normalizedPage,
              limit: normalizedLimit,
              totalPages: Math.ceil(totalProductsData / normalizedLimit),
              total: totalProductsData,
            },
          };

    await this.cacheManager.set(cacheKey, result, 10 * 1000);
    return result;
  }

  /**
   * Retrieves detailed product information for administrative viewing.
   * Returns complete details including product metadata, vendor profile, category,
   * and all product variants with their associated images.
   */
  async getProductByIdAdmin(id: string) {
    const version: string = await this.getProductCachedVersion();
    const cacheKey: string = `products:admin:detail:v${version}:${id}`;
    const cachedProductsData = await this.cacheManager.get(cacheKey);
    if (cachedProductsData) {
      return cachedProductsData;
    }

    const productBaseQuery = this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.productVariants', 'productVariant')
      .leftJoin('productVariant.productImages', 'productImage')
      .leftJoin('product.category', 'category')
      .leftJoin('product.user', 'vendor')
      .leftJoin('vendor.vendorProfile', 'vendorProfile')
      .select([
        'product.id',
        'product.name',
        'product.slug',
        'product.description',
        'product.status',
        'product.createdAt',
        'productVariant.id',
        'productVariant.sellingPrice',
        'productVariant.crossPrice',
        'productVariant.costPrice',
        'productVariant.stockQuantity',
        'productVariant.status',
        'productVariant.variantAttributes',
        'productVariant.createdAt',
        'productImage.id',
        'productImage.imageUrl',
        'productImage.isPrimary',
        'category.id',
        'category.name',
        'vendor.id',
        'vendorProfile.id',
        'vendorProfile.businessName',
        'vendorProfile.businessProfileUrl',
      ]);

    const productData: Product | null = await productBaseQuery
      .where('product.id = :id', { id: id })
      .orderBy('productVariant.isDefault', 'DESC')
      .addOrderBy('productImage.isPrimary', 'DESC')
      .getOne();

    if (!productData) {
      throw new NotFoundException('Product not found.');
    }

    const refinedProductResponseData = {
      id: productData?.id,
      name: productData?.name,
      slug: productData?.slug,
      description: productData?.description,
      status: productData?.status,
      vendorProfile: {
        id: productData?.user.id,
        businessName: productData?.user.vendorProfile.businessName,
        businessProfileUrl: productData?.user.vendorProfile.businessProfileUrl,
      },
      category: {
        id: productData?.category.id,
        name: productData?.category.name,
      },
      productVariants: productData?.productVariants.map(
        (productVariant: ProductVariant) => ({
          id: productVariant.id,
          sellingPrice: productVariant.sellingPrice,
          crossPrice: productVariant.crossPrice,
          costPrice: productVariant.costPrice,
          stockQuantity: productVariant.stockQuantity,
          status: productVariant.status,
          variantAttributes: productVariant.variantAttributes,
          productImages: productVariant.productImages.map(
            (productImage: ProductImage) => ({
              id: productImage.id,
              imageUrl: productImage.imageUrl,
            }),
          ),
        }),
      ),
    };

    await this.cacheManager.set(
      cacheKey,
      refinedProductResponseData,
      10 * 1000,
    );

    return {
      message: 'Product fetched successfully.',
      data: refinedProductResponseData,
    };
  }

  /**
   * ------ PUT - Update product status (Admin)
   * Transitions a product through lifecycle states: publish, reject, or archive.
   * Accepts an optional reviewNote for admin feedback visible to the vendor.
   */
  async updateProductStatusAdmin(
    productId: string,
    updateProductStatusDto: UpdateProductStatusDto,
    user: CurrentUserContext,
  ) {
    const product: Product | null =
      await this.productRepository.findProductById(productId);

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    await this.productRepository.updateProduct(productId, {
      status: updateProductStatusDto.status,
      flagReason: updateProductStatusDto.flagReason,
      flaggedBy: user.id,
    });

    const updatedProduct: Product | null =
      await this.productRepository.findProductById(productId);

    await this.invalidateCachedProductsVersion();

    return {
      message: 'Product status updated successfully.',
      id: updatedProduct?.id,
      name: updatedProduct?.name,
      status: updatedProduct?.status,
      flagReason: updateProductStatusDto.flagReason ?? null,
    };
  }

  /**
   * ------ PUT - Force-edit product (Admin)
   * Allows admin to update any product field including name, description, slug, categoryId, and status.
   * If name changes without an explicit slug, regenerates the slug and checks for conflicts.
   * If a slug is explicitly provided, it is used directly after conflict validation.
   */
  async updateProductAdmin(
    productId: string,
    adminUpdateProductDto: AdminUpdateProductDto,
    user: CurrentUserContext,
  ) {
    const product: Product | null =
      await this.productRepository.findProductById(productId);

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const updateData: Partial<Product> = {};
    if (adminUpdateProductDto.name !== undefined) {
      updateData.name = adminUpdateProductDto.name;
      if (adminUpdateProductDto.slug === undefined) {
        const slug: string = generateSlug(adminUpdateProductDto.name);
        const existingSlug: Product | null =
          await this.productRepository.findProductBySlug(slug);
        if (existingSlug && existingSlug.id !== productId) {
          throw new ConflictException('Product with this slug already exists.');
        }
        updateData.slug = slug;
      }
    }

    if (adminUpdateProductDto.slug !== undefined) {
      const existingSlug: Product | null =
        await this.productRepository.findProductBySlug(
          adminUpdateProductDto.slug,
        );
      if (existingSlug && existingSlug.id !== productId) {
        throw new ConflictException('Product with this slug already exists.');
      }
      updateData.slug = adminUpdateProductDto.slug;
    }

    if (adminUpdateProductDto.description !== undefined) {
      updateData.description = adminUpdateProductDto.description;
    }

    if (adminUpdateProductDto.categoryId !== undefined) {
      updateData.categoryId = adminUpdateProductDto.categoryId;
    }

    if (adminUpdateProductDto.status !== undefined) {
      updateData.status = adminUpdateProductDto.status;
    }

    if (user && adminUpdateProductDto.flagReason !== undefined) {
      updateData.flagReason = adminUpdateProductDto.flagReason;
      updateData.flaggedBy = user.id;
    }

    await this.productRepository.updateProduct(productId, updateData);

    const updatedProduct: Product | null =
      await this.productRepository.findProductById(productId);

    await this.invalidateCachedProductsVersion();

    return {
      message: 'Product updated successfully.',
      id: updatedProduct?.id,
      name: updatedProduct?.name,
      slug: updatedProduct?.slug,
      description: updatedProduct?.description,
      categoryId: updatedProduct?.categoryId,
      status: updatedProduct?.status,
    };
  }
}

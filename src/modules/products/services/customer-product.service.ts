import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ProductStatusEnum } from 'src/common/enums/product-status.enum';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { ProductImage } from '../entities/product-image.entity';
import {
  decodeCursor,
  encodeCursor,
} from 'src/common/utils/cursor-pagination.util';

@Injectable()
export class CustomerProductService {
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

  async getAllProductsCustomer({
    limit,
    cursor,
    search,
    maxPrice,
    minPrice,
  }: {
    limit: number;
    cursor?: string;
    search?: string;
    maxPrice?: number;
    minPrice?: number;
  }) {
    if (isNaN(Number(limit)) || limit <= 0) {
      throw new BadRequestException('Limit should be of positive integer.');
    }
    const normalizedLimit: number = Math.min(100, limit);

    const cacheVersion: string = await this.getProductCachedVersion();
    const cacheKey: string = `categories:customers:v:${cacheVersion}:${JSON.stringify(
      {
        limit: limit,
        cursor: cursor,
        search: search,
        maxPrice: maxPrice,
        minPrice: minPrice,
      },
    )}`;
    const cachedProductsData = await this.cacheManager.get(cacheKey);
    if (cachedProductsData) return cachedProductsData;

    const productBaseQuery = this.productRepository
      .createQueryBuilder('product')
      .leftJoin(
        'product.productVariants',
        'productVariant',
        'productVariant.isDefault = :isDefault',
        { isDefault: true },
      )
      .leftJoin(
        'productVariant.productImages',
        'productImage',
        'productImage.isPrimary = :isPrimary',
        { isPrimary: true },
      )
      .leftJoin('product.category', 'category')
      .select([
        'product.id',
        'product.name',
        'product.description',
        'product.slug',
        'product.createdAt',
        'productVariant.id',
        'productVariant.sellingPrice',
        'productVariant.crossPrice',
        'productVariant.stockQuantity',
        'productVariant.variantAttributes',
        'productImage.id',
        'productImage.imageUrl',
        'category.id',
        'category.name',
      ]);

    if (search?.trim()) {
      productBaseQuery.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR category.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    /*[ ----- Issues on this filter logic (To be fixed)]
    if (minPrice !== undefined || maxPrice !== undefined) {
      if (minPrice !== undefined && maxPrice !== undefined) {
        productBaseQuery.andWhere(
          'productVariant.sellingPrice BETWEEN :minPrice AND :maxPrice',
          { minPrice: minPrice, maxPrice: maxPrice },
        );
      } else if (minPrice !== undefined) {
        productBaseQuery.andWhere('productVariant.sellingPrice >= :minPrice', {
          minPrice: minPrice,
        });
      } else if (maxPrice !== undefined) {
        productBaseQuery.andWhere('productVariant.sellingPrice <= :maxPrice', {
          maxPrice: maxPrice,
        });
      }
    }
    */

    if (cursor) {
      const { createdAt, id }: { createdAt: string; id: string } =
        decodeCursor(cursor);
      productBaseQuery.andWhere(
        '(product.createdAt, product.id) < (:cursorCreatedAt, :cursorId)',
        { cursorCreatedAt: createdAt, cursorId: id },
      );
    }

    const productsData: Product[] = await productBaseQuery
      .andWhere('product.status = :status', {
        status: ProductStatusEnum.PUBLISHED,
      })
      .orderBy('product.createdAt', 'DESC')
      .addOrderBy('product.id', 'DESC')
      .take(normalizedLimit + 1)
      .getMany();

    const hasNextPage: boolean = productsData.length > normalizedLimit;
    const paginatedProductsData: Product[] = hasNextPage
      ? productsData.slice(0, normalizedLimit)
      : productsData;

    const lastProductOfPaginatedData: Product =
      paginatedProductsData[paginatedProductsData.length - 1];

    const nextPageCursor: string | null = hasNextPage
      ? encodeCursor(
          lastProductOfPaginatedData.createdAt,
          lastProductOfPaginatedData.id,
        )
      : null;

    const refinedProductsResponseData = paginatedProductsData.map(
      (product: Product) => {
        const productVariant: ProductVariant = product.productVariants[0];
        const productImage: ProductImage = productVariant?.productImages[0];

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          createdAt: product.createdAt,
          productVariant: productVariant
            ? {
                id: productVariant.id,
                sellingPrice: productVariant.sellingPrice,
                crossPrice: productVariant.crossPrice,
                stockQuantity: productVariant.stockQuantity,
                variantAttributes: productVariant.variantAttributes,
                productImage: productImage
                  ? {
                      id: productImage.id,
                      imageUrl: productImage.imageUrl,
                    }
                  : null,
              }
            : null,

          category: {
            id: product.category.id,
            name: product.category.name,
          },
        };
      },
    );

    const result =
      refinedProductsResponseData.length === 0
        ? {
            message: 'No products found.',
            data: [],
            meta: {
              hasNextPage: false,
              nextPageCursor: null,
            },
          }
        : {
            message: 'Product fetched successfully.',
            data: refinedProductsResponseData,
            meta: {
              hasNextPage: hasNextPage,
              nextPageCursor: nextPageCursor,
            },
          };

    await this.cacheManager.set(cacheKey, result, 10 * 1000);
    return result;
  }

  async getProductBySlug(slug: string) {
    const product: Product | null =
      await this.productRepository.findProductBySlug(slug);

    if (!product) {
      throw new NotFoundException('Product not found.');
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
        'product.description',
        'product.slug',
        'product.createdAt',
        'productVariant.id',
        'productVariant.sellingPrice',
        'productVariant.crossPrice',
        'productVariant.stockQuantity',
        'productVariant.variantAttributes',
        'productImage.id',
        'productImage.imageUrl',
        'category.id',
        'category.name',
        'vendor.id',
        'vendor.email',
        'vendorProfile.businessName',
        'vendorProfile.businessProfileUrl',
      ]);

    const productData: Product | null = await productBaseQuery
      .andWhere('product.status = :status', {
        status: ProductStatusEnum.PUBLISHED,
      })
      .getOne();

    const refinedProductResponseData = {
      id: productData?.id,
      name: productData?.name,
      slug: productData?.slug,
      description: productData?.description,
      productVariants: productData?.productVariants.map((productVariant) => ({
        id: productVariant.id,
        sellingPrice: productVariant.sellingPrice,
        crossPrice: productVariant.crossPrice,
        stockQuantity: productVariant.stockQuantity,
        variantAttributes: productVariant.variantAttributes,
        productImages: productVariant?.productImages.map((productImage) => ({
          id: productImage.id,
          imageUrl: productImage.imageUrl,
        })),
      })),
      vendorProfile: {
        id: productData?.user.id,
        email: productData?.user.email,
        businessName: productData?.user.vendorProfile.businessName,
        businessProfileUrl: productData?.user.vendorProfile.businessProfileUrl,
      },
      category: {
        id: productData?.category.id,
        name: productData?.category.name,
      },
    };

    return refinedProductResponseData;
  }

  async getSimilarProducts(slug: string) {
    const product: Product | null =
      await this.productRepository.findProductBySlug(slug);

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const productBaseQuery = this.productRepository
      .createQueryBuilder('product')
      .leftJoin(
        'product.productVariants',
        'productVariant',
        'productVariant.isDefault = :isDefault',
        { isDefault: true },
      )
      .leftJoin(
        'productVariant.productImages',
        'productImage',
        'productImage.isPrimary = :isPrimary',
        { isPrimary: true },
      )
      .leftJoin('product.category', 'category')
      .select([
        'product.id',
        'product.name',
        'product.description',
        'product.slug',
        'product.createdAt',
        'productVariant.id',
        'productVariant.sellingPrice',
        'productVariant.crossPrice',
        'productVariant.stockQuantity',
        'productVariant.variantAttributes',
        'productImage.id',
        'productImage.imageUrl',
        'category.id',
        'category.name',
      ]);

    const productsData: Product[] = await productBaseQuery
      .andWhere('product.status = :status', {
        status: ProductStatusEnum.PUBLISHED,
      })
      .andWhere('product.categoryId = :categoryId', {
        categoryId: product.categoryId,
      })
      .take(10)
      .orderBy('product.createdAt', 'DESC')
      .getMany();

    const result =
      productsData.length === 0
        ? {
            message: 'No similar Products found for this product.',
            data: [],
          }
        : {
            message: 'Similar products fetched successfully.',
            data: productsData,
          };

    return result;
  }
}

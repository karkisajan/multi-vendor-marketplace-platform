import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import { ProductRating } from '../entities/product-rating.entity';
import {
  decodeCursor,
  encodeCursor,
} from 'src/common/utils/cursor-pagination.util';
import { DatePostedTypeEnum } from 'src/common/enums/date-filters.enum';
import { CurrentUserContext } from 'src/modules/users/types/user.types';
import { ProductRatingRepository } from '../repositories/product-rating.repository';
import { CreateProductRatingDto } from '../dto/customer/create-product-rating.dto';
import { UpdateProductRatingDto } from '../dto/customer/update-product-rating.dto';
import { SelectQueryBuilder } from 'typeorm';

type ProductWithRatings = Product & {
  averageRatings: number;
  totalReviews: number;
};

@Injectable()
export class CustomerProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productRatingRepository: ProductRatingRepository,
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
   * ------ GET - Fetch all products (Customer)
   * Builds the public product listing with cursor pagination, search filtering,
   * and cache-backed responses for faster storefront browsing.
   */
  async getAllProductsCustomer({
    limit,
    cursor,
    search,
    categoryId,
    minPrice,
    maxPrice,
    datePosted,
  }: {
    limit: number;
    cursor?: string;
    search?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    datePosted?: DatePostedTypeEnum;
  }) {
    if (isNaN(Number(limit)) || limit <= 0) {
      throw new BadRequestException('Limit should be of positive integer.');
    }
    const normalizedLimit: number = Math.min(100, limit);

    const cacheVersion: string = await this.getProductCachedVersion();
    const cacheKey: string = `categories:customers:v:${cacheVersion}:${JSON.stringify(
      {
        limit: normalizedLimit,
        cursor: cursor,
        search: search,
        categoryId: categoryId,
        minPrice: minPrice,
        maxPrice: maxPrice,
        datePosted: datePosted,
      },
    )}`;

    const cachedProductsData = await this.cacheManager.get(cacheKey);
    if (cachedProductsData) {
      return cachedProductsData;
    }

    const productBaseQuery: SelectQueryBuilder<Product> = this.productRepository
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
      .leftJoin(
        (subQuery) =>
          subQuery
            .from(ProductRating, 'productRating')
            .select('productRating.productId', 'productId')
            .addSelect('AVG(productRating.score)', 'averageRatings')
            .addSelect('COUNT(productRating.id)', 'totalReviews')
            .groupBy('productRating.productId'),
        'productRatingAggregation',
        '"productRatingAggregation"."productId" = product.id',
      )
      .select([
        'product.id',
        'product.name',
        'product.slug',
        'product.createdAt',
        'productVariant.id',
        'productVariant.sellingPrice',
        'productVariant.crossPrice',
        'productImage.id',
        'productImage.imageUrl',
      ])
      .addSelect(
        'COALESCE("productRatingAggregation"."averageRatings", 0)',
        'averageRatings',
      )
      .addSelect(
        'COALESCE("productRatingAggregation"."totalReviews", 0)',
        'totalReviews',
      );

    if (search?.trim()) {
      productBaseQuery.andWhere(
        `(product.name ILIKE :search OR product.description ILIKE :search OR 
          category.name ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    /**
     * Filter products by selected category (CategorySlug)
     */
    if (categoryId) {
      productBaseQuery.andWhere('product.categoryId = :categoryId', {
        categoryId: categoryId,
      });
    }

    /* Filter products by min and max price */
    if (minPrice !== undefined || maxPrice !== undefined) {
      if (minPrice !== undefined && maxPrice !== undefined) {
        productBaseQuery.andWhere(
          `(productVariant.sellingPrice BETWEEN :minPrice AND :maxPrice)`,
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

    /**
     * Filter by datePosted (last 24 hours, 7 days, 15 days and 30 days)
     */
    if (datePosted && datePosted !== DatePostedTypeEnum.ANY_TIME) {
      const mappedDays: Record<string, any> = {
        [DatePostedTypeEnum.LAST_24_HOURS]: 1,
        [DatePostedTypeEnum.LAST_7_DAYS]: 7,
        [DatePostedTypeEnum.LAST_15_DAYS]: 15,
        [DatePostedTypeEnum.LAST_30_DAYS]: 30,
      };

      const days = mappedDays[datePosted] as number;
      if (!days) {
        throw new BadRequestException('Invalid date posted value.');
      }

      const daysSince: Date = new Date(Date.now());
      daysSince.setDate(daysSince.getDate() - days);

      productBaseQuery.andWhere('product.createdAt >= :daysSince', {
        daysSince: daysSince,
      });
    }

    /* Apply cursor if next page cursor of products exists */
    if (cursor) {
      const { createdAt, id }: { createdAt: string; id: string } =
        decodeCursor(cursor);

      productBaseQuery.andWhere(
        '(product.createdAt, product.id) < (:cursorCreatedAt, :cursorId)',
        { cursorCreatedAt: createdAt, cursorId: id },
      );
    }

    productBaseQuery
      .andWhere('product.status = :status', {
        status: ProductStatusEnum.PUBLISHED,
      })
      .orderBy('product.createdAt', 'DESC')
      .addOrderBy('product.id', 'DESC')
      .take(normalizedLimit + 1);

    const { entities, raw } =
      await productBaseQuery.getRawAndEntities<ProductWithRatings>();

    const productsData: ProductWithRatings[] = entities.map(
      (entity, index) => ({
        ...entity,
        averageRatings: Number(raw[index]?.averageRatings ?? 0),
        totalReviews: Number(raw[index]?.totalReviews ?? 0),
      }),
    );

    const hasNextPage: boolean = productsData.length > normalizedLimit;
    const paginatedProductsData: ProductWithRatings[] = hasNextPage
      ? productsData.slice(0, normalizedLimit)
      : productsData;

    const lastProductOfPaginatedData: ProductWithRatings =
      paginatedProductsData[paginatedProductsData.length - 1];

    const nextPageCursor: string | null = hasNextPage
      ? encodeCursor(
          lastProductOfPaginatedData.createdAt,
          lastProductOfPaginatedData.id,
        )
      : null;

    const refinedProductsResponseData = paginatedProductsData.map(
      (product: ProductWithRatings) => {
        const productVariant: ProductVariant = product.productVariants[0];
        const productImage: ProductImage = productVariant?.productImages[0];

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          createdAt: product.createdAt,
          averageRatings: product.averageRatings,
          totalReviews: product.totalReviews,
          productVariant: productVariant
            ? {
                id: productVariant.id,
                sellingPrice: productVariant.sellingPrice,
                crossPrice: productVariant.crossPrice,
                productImage: productImage
                  ? {
                      id: productImage.id,
                      imageUrl: productImage.imageUrl,
                    }
                  : null,
              }
            : null,
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

  /**
   * ------ GET - Fetch product by slug (Customer)
   * Returns the public product detail payload for a published product and throws
   * NotFoundException when the slug does not resolve to an available product.
   */
  async getProductBySlug(slug: string) {
    const cacheVersion: string = await this.getProductCachedVersion();
    const cacheKey: string = `products:customer:v${cacheVersion}:${JSON.stringify({ slug: slug })}`;
    const cachedProductData = await this.cacheManager.get(cacheKey);
    if (cachedProductData) return cachedProductData;

    const productBaseQuery = this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.productVariants', 'productVariant')
      .leftJoin('productVariant.productImages', 'productImage')
      .leftJoin('product.productSpecifications', 'productSpecification')
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
        'productSpecification.id',
        'productSpecification.key',
        'productSpecification.value',
        'category.id',
        'category.name',
        'vendor.id',
        'vendor.email',
        'vendorProfile.businessName',
        'vendorProfile.businessProfileUrl',
      ]);

    const productData: Product | null = await productBaseQuery
      .where('product.slug = :slug', { slug: slug })
      .andWhere('product.status = :status', {
        status: ProductStatusEnum.PUBLISHED,
      })
      .orderBy('productVariant.isDefault', 'DESC')
      .addOrderBy('productImage.isPrimary', 'DESC')
      .addOrderBy('productSpecification.sortOrder', 'ASC')
      .getOne();

    if (!productData) {
      throw new NotFoundException('Product not found.');
    }

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
      productSpecifications: productData.productSpecifications.map(
        (productSpecification) => ({
          id: productSpecification.id,
          key: productSpecification.key,
          value: productSpecification.value,
        }),
      ),
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
   * ------ GET - Fetch similar products (Customer)
   * Returns products from the same category as the requested item so the storefront
   * can suggest related inventory to the customer.
   */
  async getSimilarProducts(slug: string) {
    const cacheVersion: string = await this.getProductCachedVersion();
    const cacheKey: string = `products:customer:v:${cacheVersion}:${JSON.stringify({ slug: slug })}`;
    const cachedProductData = await this.cacheManager.get(cacheKey);
    if (cachedProductData) return cachedProductData;

    const product: Product | null =
      await this.productRepository.findProductBySlug(slug);

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const productBaseQuery: SelectQueryBuilder<Product> = this.productRepository
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
      .leftJoin(
        (subQuery) =>
          subQuery
            .from(ProductRating, 'productRating')
            .select('productRating.productId', 'productId')
            .addSelect('AVG(productRating.score)', 'averageRatings')
            .addSelect('COUNT(productRating.id)', 'totalReviews')
            .groupBy('productRating.productId'),
        'productRatingAggregation',
        '"productRatingAggregation"."productId" = product.id',
      )
      .select([
        'product.id',
        'product.name',
        'product.slug',
        'product.createdAt',
        'productVariant.id',
        'productVariant.sellingPrice',
        'productVariant.crossPrice',
        'productImage.id',
        'productImage.imageUrl',
      ])
      .addSelect(
        'COALESCE("productRatingAggregation"."averageRatings", 0)',
        'averageRatings',
      )
      .addSelect(
        'COALESCE("productRatingAggregation"."totalReviews", 0)',
        'totalReviews',
      );

    productBaseQuery
      .andWhere('product.status = :status', {
        status: ProductStatusEnum.PUBLISHED,
      })
      .andWhere('product.categoryId = :categoryId', {
        categoryId: product.categoryId,
      })
      .take(10)
      .orderBy('product.createdAt', 'DESC');

    const { entities, raw } =
      await productBaseQuery.getRawAndEntities<ProductWithRatings>();

    const productsData: ProductWithRatings[] = entities.map(
      (entity, index) => ({
        ...entity,
        averageRatings: Number(raw[index]?.averageRatings ?? 0),
        totalReviews: Number(raw[index]?.totalReviews ?? 0),
      }),
    );

    const refinedProductResponseData = productsData.map(
      (product: ProductWithRatings) => {
        const productVariant: ProductVariant = product.productVariants[0];
        const productImage: ProductImage = productVariant?.productImages[0];

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          createdAt: product.createdAt,
          averageRatings: product.averageRatings,
          totalReviews: product.totalReviews,
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
        };
      },
    );

    const result =
      refinedProductResponseData.length === 0
        ? {
            message: 'No similar Products found for this product.',
            data: [],
          }
        : {
            message: 'Similar products fetched successfully.',
            data: refinedProductResponseData,
          };

    await this.cacheManager.set(cacheKey, result, 10 * 1000);
    return result;
  }

  /**
   * ------ POST - Create product rating (Customer)
   * Validates that the product exists and is published, ensures the customer has not
   * already rated it, and persists the new rating with the authenticated user as owner.
   */
  async createRating(
    productId: string,
    createProductRatingDto: CreateProductRatingDto,
    user: CurrentUserContext,
  ) {
    const product: Product | null =
      await this.productRepository.findProductById(productId);

    if (!product || product.status !== ProductStatusEnum.PUBLISHED) {
      throw new NotFoundException('Product not found.');
    }

    const existingRating: ProductRating | null =
      await this.productRatingRepository.findOne({
        where: { productId: productId, customerId: user.id },
      });

    if (existingRating) {
      throw new ConflictException('You have already rated this product.');
    }

    const rating: ProductRating = this.productRatingRepository.create({
      productId: productId,
      customerId: user.id,
      score: createProductRatingDto.score,
      comment: createProductRatingDto.comment,
    });

    const savedRating: ProductRating =
      await this.productRatingRepository.save(rating);

    return {
      message: 'Rating added successfully.',
      data: {
        id: savedRating.id,
        score: savedRating.score,
        comment: savedRating.comment,
        productId: savedRating.productId,
        createdAt: savedRating.createdAt,
      },
    };
  }

  /**
   * ------ PATCH - Update own product rating (Customer)
   * Finds the rating by ID, verifies the authenticated user owns it,
   * and applies the partial update to score and/or comment.
   */
  async updateRating(
    ratingId: string,
    updateProductRatingDto: UpdateProductRatingDto,
    user: CurrentUserContext,
  ) {
    const rating: ProductRating | null =
      await this.productRatingRepository.findOne({
        where: { id: ratingId },
      });

    if (!rating) {
      throw new NotFoundException('Rating not found.');
    }

    if (rating.customerId !== user.id) {
      throw new ForbiddenException('You can only update your own ratings.');
    }

    /* Apply partial updates */
    if (updateProductRatingDto.score !== undefined) {
      rating.score = updateProductRatingDto.score;
    }
    if (updateProductRatingDto.comment !== undefined) {
      rating.comment = updateProductRatingDto.comment;
    }

    const updatedRating: ProductRating =
      await this.productRatingRepository.save(rating);

    return {
      message: 'Rating updated successfully.',
      data: {
        id: updatedRating.id,
        score: updatedRating.score,
        comment: updatedRating.comment,
        productId: updatedRating.productId,
        updatedAt: updatedRating.updatedAt,
      },
    };
  }

  /**
   * ------ DELETE - Delete own product rating (Customer)
   * Finds the rating by ID, verifies ownership, and performs a soft-delete
   * so the record is excluded from queries but retained for auditing.
   */
  async deleteRating(ratingId: string, user: CurrentUserContext) {
    const rating: ProductRating | null =
      await this.productRatingRepository.findOne({
        where: { id: ratingId },
      });

    if (!rating) {
      throw new NotFoundException('Rating not found.');
    }

    if (rating.customerId !== user.id) {
      throw new ForbiddenException('You can only delete your own ratings.');
    }

    await this.productRatingRepository.softRemove(rating);

    return {
      message: 'Rating deleted successfully.',
    };
  }
}

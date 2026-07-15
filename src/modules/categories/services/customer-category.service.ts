import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category } from '../entities/category.entity';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Product } from 'src/modules/products/entities/product.entity';
import { normalizePagination } from 'src/common/utils/validate-pagination.util';
import { CategoryRepository } from '../repositories/category.repository';
import { ProductRepository } from 'src/modules/products/repositories/product.repository';
import { ProductStatusEnum } from 'src/common/enums/product-status.enum';
import {
  decodeCursor,
  encodeCursor,
} from 'src/common/utils/cursor-pagination.util';
import { ProductVariant } from 'src/modules/products/entities/product-variant.entity';
import { ProductImage } from 'src/modules/products/entities/product-image.entity';
import { CategoryHelperService } from './category-helper.service';
import { ProductRating } from 'src/modules/products/entities/product-rating.entity';
import { DataSource, SelectQueryBuilder } from 'typeorm';

type ProductWithRatings = Product & {
  averageRatings: number;
  totalReviews: number;
};

@Injectable()
export class CustomerCategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly categoryHelperService: CategoryHelperService,
    private readonly productRepository: ProductRepository,

    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Reads the current category cache namespace version; defaults to version 1
   * so read endpoints can build stable keys before any mutation has occurred.
   */
  private async getCachedCategoryVersion(): Promise<string> {
    const version = await this.cacheManager.get<string | number>(
      'categories:version',
    );
    return String(version ?? 1);
  }

  /**
   * Retrieves a filtered category tree for customers, containing only published categories
   * and selecting a subset of fields (id, name, slug, imageUrl). Uses version-based cache keys.
   */
  async getCategoryTreeCustomer(): Promise<
    Array<Category & { children: Array<Category & { children: Category[] }> }>
  > {
    const version: string = await this.getCachedCategoryVersion();
    const cacheKey: string = `categories:v${version}:tree`;
    const cachedData =
      await this.cacheManager.get<
        Array<
          Category & { children: Array<Category & { children: Category[] }> }
        >
      >(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const result: Array<
      Category & { children: Array<Category & { children: Category[] }> }
    > = await this.categoryHelperService.buildCategoryTree({
      isPublished: true,
      select: ['id', 'name', 'slug', 'imageUrl'],
    });

    await this.cacheManager.set(cacheKey, result, 10 * 1000);
    return result;
  }

  /**
   * ------ GET - parent-categories
   * Retrieves a paginated list of all top-level parent categories (where parentId is null).
   * Validates pagination inputs and caches the response with standard pagination metadata.
   */
  async getAllParentCategories({
    page,
    limit,
  }: {
    page: number;
    limit: number;
  }) {
    const {
      normalizedPage,
      normalizedLimit,
    }: { normalizedPage: number; normalizedLimit: number } =
      normalizePagination(page, limit);

    const version: string = await this.getCachedCategoryVersion();
    const cacheKey: string = `categories:v${version}:parent:${JSON.stringify({ page: normalizedPage, limit: normalizedLimit })}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const {
      categories,
      totalCategories,
    }: { categories: Category[]; totalCategories: number } =
      await this.categoryRepository.findAndCountParentCategories({
        page: normalizedPage,
        limit: normalizedLimit,
      });

    const result =
      totalCategories === 0
        ? {
            data: [],
            meta: {
              page: normalizedPage,
              limit: normalizedLimit,
              total: 0,
              totalPages: 0,
            },
          }
        : {
            data: categories,
            meta: {
              page: normalizedPage,
              limit: normalizedLimit,
              total: totalCategories,
              totalPages: Math.ceil(totalCategories / normalizedLimit),
            },
          };

    await this.cacheManager.set(cacheKey, result, 10 * 1000);
    return result;
  }

  /**
   * Resolves all third-level child categories belonging to a top-level parent category.
   * Performs an inner join to find sub-categories up to three levels deep.
   *
   * @param parentId - The UUID of the parent category.
   * @returns A promise resolving to an array of child category IDs.
   */
  private async getThirdLevelCategories(parentId: string): Promise<string[]> {
    const thirdLevelCategories = await this.categoryRepository
      .createQueryBuilder('thirdLevelCategory')
      .innerJoin(
        Category,
        'secondLevelCategory',
        'secondLevelCategory.id = thirdLevelCategory.parentId',
      )
      .where('secondLevelCategory.parentId = :parentId', { parentId })
      .select('thirdLevelCategory.id', 'id')
      .getRawMany<{ id: string }>();

    return thirdLevelCategories.map((category) => category.id);
  }

  /**
   * Retrieves a paginated list of published products for a category based on its slug.
   * Resolves the category by its slug, gathers third-level child category IDs, and
   * filters published products belonging to those categories with cursor pagination.
   */
  async getProductsOfCategory({
    slug,
    limit,
    cursor,
  }: {
    slug: string;
    limit: number;
    cursor?: string;
  }) {
    if (isNaN(Number(limit)) || limit <= 0) {
      throw new BadRequestException('Limit should be of positive integer.');
    }
    const normalizedLimit: number = Math.min(limit, 100);

    const category: Category | null =
      await this.categoryRepository.findCategoryBySlug(slug);

    if (!category) {
      throw new NotFoundException('Category not found');
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

    if (cursor) {
      const { createdAt, id }: { createdAt: string; id: string } =
        decodeCursor(cursor);

      productBaseQuery.andWhere(
        `(product.createdAt, product.id) < (:cursorCreatedAt, :cursorId)`,
        { cursorCreatedAt: createdAt, cursorId: id },
      );
    }

    const categoryIds: string[] = await this.getThirdLevelCategories(
      category.id,
    );

    productBaseQuery
      .where('product.categoryId IN (:...categoryIds)', {
        categoryIds: categoryIds,
      })
      .andWhere('product.status = :status', {
        status: ProductStatusEnum.PUBLISHED,
      })
      .orderBy('product.createdAt', 'DESC')
      .addOrderBy('product.id', 'DESC')
      .take(normalizedLimit + 1);

    const { entities, raw } =
      await productBaseQuery.getRawAndEntities<ProductWithRatings>();

    const productsData = entities.map((entity, index) => ({
      ...entity,
      averageRatings: Number(raw[index]?.averageRatings ?? 0),
      totalReviews: Number(raw[index]?.totalReviews ?? 0),
    }));

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

    const products = paginatedProductsData.map(
      (product: ProductWithRatings) => {
        const productVariant: ProductVariant = product.productVariants[0];
        const productImage: ProductImage = productVariant?.productImages[0];

        return {
          id: category.id,
          name: category.name,
          shortDescription: category.shortDescription,
          longDescription: category.longDescription,
          product: {
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
          },
        };
      },
    );

    const result = {
      message:
        products.length === 0
          ? 'No products found for this category'
          : 'Products fetched successfully.',

      id: category.id,
      name: category.name,
      shortDescription: category.shortDescription,
      longDescription: category.longDescription,
      products: products,
      meta: {
        hasNextPage: hasNextPage,
        nextPageCursor: nextPageCursor,
      },
    };

    return result;
  }
}

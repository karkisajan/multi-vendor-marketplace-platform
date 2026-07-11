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

@Injectable()
export class CustomerCategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly categoryHelperService: CategoryHelperService,
    private readonly productRepository: ProductRepository,
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
   * Retrieves the product-lists based on provided category.
   */
  async getProductsOfCategory({
    categoryId,
    limit,
    cursor,
  }: {
    categoryId: string;
    limit: number;
    cursor?: string;
  }) {
    if (isNaN(Number(limit)) || limit <= 0) {
      throw new BadRequestException('Limit should be of positive integer.');
    }
    const normalizedLimit: number = Math.min(limit, 100);

    const category: Category | null =
      await this.categoryRepository.findCategoryById(categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
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

    if (cursor) {
      const { createdAt, id }: { createdAt: string; id: string } =
        decodeCursor(cursor);

      productBaseQuery.andWhere(
        `(product.createdAt, product.id) < (:cursorCreatedAt, cursorId )`,
        { cursorCreatedAt: createdAt, cursorId: id },
      );
    }

    const productsData: Product[] = await productBaseQuery
      .where('product.status = :status', {
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

    const refinedProductResponseData = paginatedProductsData.map(
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
        };
      },
    );

    const result =
      refinedProductResponseData.length === 0
        ? {
            message: 'No products found for this category.',
            data: [],
            meta: {
              hasNextPage: hasNextPage,
              nextPageCursor: nextPageCursor,
            },
          }
        : {
            message: `Products fetched successfully.`,
            data: refinedProductResponseData,
            meta: {
              hasNextPage: hasNextPage,
              nextPageCursor: nextPageCursor,
            },
          };

    return result;
  }
}

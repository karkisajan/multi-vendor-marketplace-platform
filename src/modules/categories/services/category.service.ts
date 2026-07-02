import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoryRepository } from '../repositories/category.repository';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { Category } from '../entities/category.entity';
import { generateSlug } from 'src/common/utils/generate-slug.util';
import { validatePaginationFields } from 'src/common/utils/validate-pagination.util';
import { StatusTypeEnum } from 'src/common/enums/status-type.enum';
import { FindOptionsWhere, ILike, IsNull } from 'typeorm';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { randomUUID } from 'crypto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
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
   * Advances the category cache namespace after create, update, or delete.
   * Existing list/tree entries stay in Redis until TTL expiry, while new reads use a unique token.
   */
  private async invalidateCategoryCache(): Promise<void> {
    await this.cacheManager.set('categories:version', randomUUID());
  }

  /**
   * Recursively builds a 3-level deep nested category tree structure.
   * Leverages sequential database queries to populate parent-child relationships up to three levels.
   */
  private async buildCategoryTree(options: {
    select?: (keyof Category)[];
    isPublished?: boolean;
  }): Promise<
    Array<Category & { children: Array<Category & { children: Category[] }> }>
  > {
    const { select, isPublished } = options;

    const findOptions = (parentId: string | null) => ({
      where: {
        parentId: parentId === null ? IsNull() : parentId,
        ...(isPublished ? { status: StatusTypeEnum.PUBLISHED } : {}),
      },
      ...(select ? { select: select } : {}),
    });

    /* 1st Level: Top-level parent categories */
    const firstLevelCategories: Category[] = await this.categoryRepository.find(
      findOptions(null),
    );

    const result: Array<
      Category & { children: Array<Category & { children: Category[] }> }
    > = [];
    for (const firstLevelCategory of firstLevelCategories) {
      /* 2nd Level: Direct sub-categories */
      const secondLevelCategories: Category[] =
        await this.categoryRepository.find(findOptions(firstLevelCategory.id));

      const secondLevelCategoriesResult: Array<
        Category & { children: Category[] }
      > = [];
      for (const secondLevelCategory of secondLevelCategories) {
        /* 3rd Level: Leaf sub-categories */
        const thirdLevelCategories: Category[] =
          await this.categoryRepository.find(
            findOptions(secondLevelCategory.id),
          );

        secondLevelCategoriesResult.push({
          ...secondLevelCategory,
          children: thirdLevelCategories,
        });
      }

      result.push({
        ...firstLevelCategory,
        children: secondLevelCategoriesResult,
      });
    }

    return result;
  }

  /**
   * Helper method to map filtering criteria (status, isActive, search query)
   * to a TypeORM FindOptionsWhere conditions object.
   */
  private filterCategories(
    status?: StatusTypeEnum,
    isActive?: boolean,
    query?: string,
  ): FindOptionsWhere<Category> {
    const whereCondition: Record<string, any> = {};

    if (status && Object.values(StatusTypeEnum).includes(status)) {
      whereCondition.status = status;
    }

    if (typeof isActive === 'boolean') {
      whereCondition.isActive = isActive;
    }

    if (query) {
      whereCondition.name = ILike(`%${query.toLowerCase().toString()}%`);
    }

    return whereCondition;
  }

  /* =============== Customer specific services */
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
    > = await this.buildCategoryTree({
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
    const newLimit: number = validatePaginationFields(page, limit);

    const version: string = await this.getCachedCategoryVersion();
    const cacheKey: string = `categories:v${version}:parent:page=${page}:limit=${newLimit}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const {
      categories,
      totalCategories,
    }: { categories: Category[]; totalCategories: number } =
      await this.categoryRepository.findAndCountParentCategories({
        page: page,
        limit: newLimit,
      });

    const result =
      totalCategories === 0
        ? {
            data: [],
            meta: { page: page, limit: newLimit, total: 0, totalPages: 0 },
          }
        : {
            data: categories,
            meta: {
              page: page,
              limit: newLimit,
              total: totalCategories,
              totalPages: Math.ceil(totalCategories / newLimit),
            },
          };

    await this.cacheManager.set(cacheKey, result, 10 * 1000);
    return result;
  }

  /* ============== Admin specific services */
  /**
   * ------ GET - flat categories
   * Retrieves a paginated list of all categories in a flat format, with optional filtering criteria applied.
   * Validates pagination parameters, builds TypeORM filter options, and caches each filter set separately.
   */
  async getFlatCategories({
    page,
    limit,
    status,
    isActive,
    query,
  }: {
    page: number;
    limit: number;
    status?: StatusTypeEnum;
    isActive?: boolean;
    query?: string;
  }) {
    const newLimit: number = validatePaginationFields(page, limit);

    const version: string = await this.getCachedCategoryVersion();
    const normalizedQuery = query?.trim().toLowerCase() ?? '';
    const cacheKey: string = `categories:v${version}:flat:page=${page}:limit=${newLimit}:status=${status ?? 'all'}:isActive=${typeof isActive === 'boolean' ? isActive : 'all'}:query=${normalizedQuery}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) return cachedData;

    const whereCondition: FindOptionsWhere<Category> = this.filterCategories(
      status,
      isActive,
      query,
    );

    const { categories, totalCategories } =
      await this.categoryRepository.findAndCountCategories({
        page,
        limit: newLimit,
        whereCondition,
      });

    const result =
      categories.length === 0
        ? {
            data: [],
            meta: { page: page, limit: newLimit, total: 0, totalPages: 0 },
          }
        : {
            data: categories,
            meta: {
              page: page,
              limit: newLimit,
              total: totalCategories,
              totalPages: Math.ceil(totalCategories / newLimit),
            },
          };

    await this.cacheManager.set(cacheKey, result, 10 * 1000);
    return result;
  }

  /**
   * Retrieves the complete category tree for admin use (includes unpublished categories).
   * Utilizes version-based cache key verification to serve cached responses when available.
   */
  async getCategoryTreeAdmin(): Promise<
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
    > = await this.buildCategoryTree({ isPublished: false });

    await this.cacheManager.set(cacheKey, result, 10 * 1000);
    return result;
  }

  /**
   * ------ POST - Create category
   * Creates a new category. Ensures name uniqueness and checks parent category existence if parentId is provided.
   * Generates a unique slug, persists it in the database, and advances the category cache version.
   */
  async createCategory(createCategoryDto: CreateCategoryDto) {
    if (createCategoryDto.parentId) {
      const parentCategory: Category | null =
        await this.categoryRepository.findCategoryById(
          createCategoryDto.parentId,
        );
      if (!parentCategory) {
        throw new NotFoundException('Parent category not found.');
      }
    }

    const existingCategory: Category | null =
      await this.categoryRepository.findCategoryByName(createCategoryDto.name);
    if (existingCategory) {
      throw new ConflictException('Category with this name already exists.');
    }

    const slug: string = generateSlug(createCategoryDto.name);
    const existingSlug: Category | null =
      await this.categoryRepository.findCategoryBySlug(slug);
    if (existingSlug) {
      throw new ConflictException(
        'Category with this generated slug already exists.',
      );
    }

    const savedCategory: Category =
      await this.categoryRepository.createCategory(createCategoryDto, slug);

    await this.invalidateCategoryCache();

    return {
      message: 'Category created successfully.',
      id: savedCategory.id,
      name: savedCategory.name,
      slug: savedCategory.slug,
      description: savedCategory.description,
      isActive: savedCategory.isActive,
      status: savedCategory.status,
      parentId: savedCategory.parentId,
    };
  }

  /**
   * ------ PUT - Update category
   * Updates fields of an existing category by its ID.
   * If name changes, it checks for name uniqueness and regenerates the slug.
   * If parentId changes, it prevents self-parenting, ensures the parent exists, and advances cached category reads.
   */
  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category: Category | null =
      await this.categoryRepository.findCategoryById(id);
    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    if (updateCategoryDto.parentId !== undefined) {
      if (updateCategoryDto.parentId === id) {
        throw new ConflictException('A category cannot be its own parent.');
      }
      if (updateCategoryDto.parentId !== null) {
        const parent = await this.categoryRepository.findCategoryById(
          updateCategoryDto.parentId,
        );
        if (!parent) {
          throw new NotFoundException('Parent category not found.');
        }
      }
    }

    let slug: string | undefined;
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findCategoryByName(
        updateCategoryDto.name,
      );
      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException('Category with this name already exists.');
      }

      slug = generateSlug(updateCategoryDto.name);
      const existingSlug =
        await this.categoryRepository.findCategoryBySlug(slug);
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictException(
          'Category with this generated slug already exists.',
        );
      }
    }

    const updated = await this.categoryRepository.updateCategory(
      id,
      updateCategoryDto,
      slug,
    );
    if (!updated) {
      throw new NotFoundException('Category not found after update.');
    }

    await this.invalidateCategoryCache();
    return updated;
  }

  /**
   * ------ DELETE - Delete category
   * Removes an existing category after confirming it has no child categories.
   * Advances the category cache version so list and tree endpoints stop using stale keys.
   */
  async deleteCategory(categoryId: string) {
    const category: Category | null =
      await this.categoryRepository.findCategoryById(categoryId);
    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    if (category.parentId === null) {
      const subChildCategories = await this.categoryRepository.find({
        where: {
          parentId: categoryId,
        },
      });

      if (subChildCategories.length > 0) {
        throw new ConflictException(
          'Deletion failed. Sub-categories exists for this parent.',
        );
      }
    } else if (category.parentId !== null) {
      const subChildCategories = await this.categoryRepository.find({
        where: {
          parentId: categoryId,
        },
      });

      if (subChildCategories.length > 0) {
        throw new ConflictException(
          'Deletion failed. Sub-categories exists for this parent.',
        );
      }
    }

    await this.categoryRepository.delete(categoryId);
    await this.invalidateCategoryCache();
    return {
      id: `${categoryId}`,
      message: 'Category deleted successfully.',
    };
  }
}

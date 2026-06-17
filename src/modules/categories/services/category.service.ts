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

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Helper method to map filtering criteria (status, isActive, search query)
   * to a TypeORM FindOptionsWhere conditions object.
   * @param status - Filter by publication status
   * @param isActive - Filter by category visibility
   * @param query - Case-insensitive partial match query for category name
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

  /**
   * ------ GET - parent-categories
   * Retrieves a paginated list of all top-level parent categories (where parentId is null).
   * Validates pagination inputs and caches the response with standard pagination metadata.
   * @param page - Page number (1-indexed)
   * @param limit - Number of items to retrieve per page
   * @returns Object containing categories list and pagination metadata
   */
  async getAllParentCategories({
    page,
    limit,
  }: {
    page: number;
    limit: number;
  }) {
    const newLimit: number = validatePaginationFields(page, limit);

    const cacheKey = `categories:parent:page=${page}:limit=${newLimit}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) return cachedData;

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

    await this.cacheManager.set(cacheKey, result, 5 * 60 * 1000);
    return result;
  }

  /**
   * ------ GET - flat categories
   * Retrieves a paginated list of all categories in a flat format, with optional filtering criteria applied.
   * Validates pagination parameters, builds TypeORM filter options, and caches the paginated response.
   * @param params - Object containing pagination options and filters (status, isActive, search query)
   * @returns Object containing categories list and pagination metadata
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

    const cacheKey = `categories:flat:page=${page}:limit=${newLimit}`;
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
        limit,
        whereCondition,
      });

    const result =
      categories.length === 0
        ? {
            data: [],
            meta: { page: page, limit: newLimit, total: 0, totalPages: 0 },
          }
        : {
            data: [],
            meta: {
              page: page,
              limit: newLimit,
              total: totalCategories,
              totalPages: Math.ceil(totalCategories / newLimit),
            },
          };

    await this.cacheManager.set(cacheKey, result, 5 * 60 * 1000);
    return result;
  }

  /**
   * ------ GET - category-tree
   * Builds and returns a 3-level deep hierarchical category tree.
   * Queries parent categories first, then fetches their child and grandchild relationships iteratively.
   * @returns Hierarchical nested category tree list with child subcategories
   */
  async getCategoryTree(): Promise<
    Array<Category & { children: Array<Category & { children: Category[] }> }>
  > {
    const cacheKey = `categories:tree`;
    const cachedData =
      await this.cacheManager.get<
        Array<
          Category & { children: Array<Category & { children: Category[] }> }
        >
      >(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    /* GET first level parent-categories */
    const firstLevelCategories: Category[] = await this.categoryRepository.find(
      {
        where: {
          parentId: IsNull(),
        },
        select: ['id', 'name', 'slug', 'imageUrl'],
      },
    );

    const result: Array<
      Category & { children: Array<Category & { children: Category[] }> }
    > = [];
    for (const firstLevelCategory of firstLevelCategories) {
      const secondLevelCategories = await this.categoryRepository.find({
        where: {
          parentId: firstLevelCategory.id,
        },
        select: ['id', 'name', 'slug', 'imageUrl'],
      });

      const secondLevelCategoriesResult: Array<
        Category & { children: Category[] }
      > = [];
      for (const secondLevelCategory of secondLevelCategories) {
        const thirdLevelCategories = await this.categoryRepository.find({
          where: {
            parentId: secondLevelCategory.id,
          },
          select: ['id', 'name', 'slug', 'imageUrl'],
        });

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

    await this.cacheManager.set(cacheKey, result, 5 * 60 * 1000);
    return result;
  }

  /**
   * ------ POST - Create category
   * Creates a new category. Ensures name uniqueness and checks parent category existence if parentId is provided.
   * Generates a unique slug from the category name and persists it in the database.
   * @param createCategoryDto - Category definition payload
   * @returns Saved category details including generated ID and slug
   * @throws NotFoundException if the referenced parent category does not exist
   * @throws ConflictException if a category with the same name or generated slug already exists
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
   * If parentId changes, it prevents circular references (assigning self as parent) and ensures the parent exists.
   * @param id - Category ID to update
   * @param updateCategoryDto - Fields to update
   * @returns The updated category record
   * @throws NotFoundException if the category or the new parent category is not found
   * @throws ConflictException if name/slug conflicts occur or if the category is assigned as its own parent
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

    return updated;
  }

  /**
   * ------ DELETE - Delete category
   * Removes an existing category after confirming it has no child categories.
   * Returns a success payload with the deleted category ID.
   * @throws NotFoundException if the category does not exist
   * @throws ConflictException if any sub-categories still reference this category as parent
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
    return {
      id: `${categoryId}`,
      message: 'Category deleted successfully.',
    };
  }
}

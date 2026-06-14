import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoryRepository } from '../repositories/category.repository';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { Category } from '../entities/category.entity';
import { generateSlug } from 'src/common/utils/generate-slug.util';
import { validatePagination } from 'src/common/utils/validate-pagination.util';
import { validatePaginationLimit } from 'src/common/utils/validate-paginationLimit.util';
import { StatusTypeEnum } from 'src/common/enums/status-type.enum';
import { FindOptionsWhere, ILike } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  /* Filter categories by ( status, isActive and query ) */
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

  /* GET - flat categories */
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
    validatePagination(page, limit);
    const newLimit: number = validatePaginationLimit(limit);

    const whereCondition: FindOptionsWhere<Category> = this.filterCategories(
      status,
      isActive,
      query,
    );

    const { categories, totalCategories } =
      await this.categoryRepository.findAllCategories({
        page,
        limit,
        whereCondition,
      });

    if (categories.length === 0) {
      return {
        data: [],
        meta: {
          page: page,
          limit: newLimit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const totalPages: number =
      totalCategories === 0 ? 0 : Math.ceil(totalCategories / newLimit);
    return {
      data: categories,
      meta: {
        page: page,
        limit: newLimit,
        total: totalCategories,
        totalPages: totalPages,
      },
    };
  }

  /**
   * Creates a new product category after ensuring the name is unique.
   * Generates a slug automatically from the category name.
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
   * Updates an existing category by ID.
   * If the name changes, validates uniqueness and regenerates the slug.
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
}

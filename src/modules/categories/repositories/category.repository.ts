import { Injectable } from '@nestjs/common';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { StatusTypeEnum } from 'src/common/enums/status-type.enum';

@Injectable()
export class CategoryRepository extends Repository<Category> {
  constructor(dataSource: DataSource) {
    super(Category, dataSource.createEntityManager());
  }

  /**
   * Finds a category by its name.
   */
  async findCategoryByName(name: string): Promise<Category | null> {
    return await this.findOne({ where: { name: name } });
  }

  /**
   * Finds a category by its slug.
   */
  async findCategoryBySlug(slug: string): Promise<Category | null> {
    return await this.findOne({ where: { slug } });
  }

  /**
   * Finds a category by its ID.
   */
  async findCategoryById(id: string): Promise<Category | null> {
    return this.findOne({ where: { id } });
  }

  async findAndCountParentCategories({
    page,
    limit,
  }: {
    page: number;
    limit: number;
  }): Promise<{ categories: Category[]; totalCategories: number }> {
    const [categories, totalCategories]: [Category[], number] =
      await Promise.all([
        this.find({
          where: {
            parentId: IsNull(),
            status: StatusTypeEnum.PUBLISHED,
            isActive: true,
          },
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: 'desc' },
          select: ['id', 'name', 'slug', 'imageUrl'],
        }),

        this.count(),
      ]);

    return { categories, totalCategories };
  }

  /**
   * GET flat list of categories
   */
  async findAndCountCategories({
    page,
    limit,
    whereCondition,
  }: {
    page: number;
    limit: number;
    whereCondition: Record<string, any>;
  }): Promise<{ categories: Category[]; totalCategories: number }> {
    const [categories, totalCategories]: [Category[], number] =
      await Promise.all([
        this.find({
          where: whereCondition,
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: 'desc' },
          select: [
            'id',
            'name',
            'slug',
            'imageUrl',
            'description',
            'isActive',
            'status',
            'parentId',
            'createdAt',
          ],
        }),

        this.count(),
      ]);

    return { categories, totalCategories };
  }

  /**
   * Creates and persists a new category.
   */
  async createCategory(
    createCategoryDto: CreateCategoryDto,
    slug: string,
  ): Promise<Category> {
    const category = this.create({
      name: createCategoryDto.name,
      description: createCategoryDto.description,
      isActive: createCategoryDto.isActive ?? true,
      status: createCategoryDto.status,
      parentId: createCategoryDto.parentId ?? null,
      slug: slug,
    });
    return await this.save(category);
  }

  /**
   * Updates an existing category by ID.
   */
  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    slug?: string,
  ): Promise<Category | null> {
    const updateData: Partial<Category> = {};
    if (updateCategoryDto.name !== undefined) {
      updateData.name = updateCategoryDto.name;
    }
    if (updateCategoryDto.description !== undefined) {
      updateData.description = updateCategoryDto.description;
    }
    if (updateCategoryDto.imageUrl !== undefined) {
      updateData.imageUrl = updateCategoryDto.imageUrl;
    }
    if (updateCategoryDto.isActive !== undefined) {
      updateData.isActive = updateCategoryDto.isActive;
    }
    if (updateCategoryDto.status !== undefined) {
      updateData.status = updateCategoryDto.status;
    }
    if (updateCategoryDto.parentId !== undefined) {
      updateData.parentId = updateCategoryDto.parentId;
    }
    if (slug !== undefined) {
      updateData.slug = slug;
    }

    await this.update(id, updateData);
    return await this.findCategoryById(id);
  }
}

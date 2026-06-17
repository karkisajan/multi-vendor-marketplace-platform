import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StatusTypeEnum } from 'src/common/enums/status-type.enum';
import { Category } from '../entities/category.entity';
import { CategoryRepository } from '../repositories/category.repository';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;

  const categoryRepository = {
    findCategoryById: jest.fn(),
    findCategoryByName: jest.fn(),
    findCategoryBySlug: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
    findAndCountParentCategories: jest.fn(),
    findAndCountCategories: jest.fn(),
  };

  const cacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const baseCategory: Category = {
    id: 'category-id',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Gadgets and accessories',
    imageUrl: 'https://cdn.example.com/categories/electronics.png',
    isActive: true,
    status: StatusTypeEnum.PUBLISHED,
    parentId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: CategoryRepository, useValue: categoryRepository },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    jest.clearAllMocks();
  });

  describe('cache versioning', () => {
    it('should return cached flat categories without querying the repository', async () => {
      const cachedResponse = {
        data: [baseCategory],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      cacheManager.get.mockImplementation((key: string) => {
        if (key === 'categories:version') return Promise.resolve(7);
        if (
          key ===
          'categories:v7:flat:page=1:limit=10:status=all:isActive=all:query='
        ) {
          return Promise.resolve(cachedResponse);
        }
        return Promise.resolve(undefined);
      });

      const result = await service.getFlatCategories({ page: 1, limit: 10 });

      expect(result).toEqual(cachedResponse);
      expect(categoryRepository.findAndCountCategories).not.toHaveBeenCalled();
      expect(cacheManager.set).not.toHaveBeenCalled();
    });

    it('should include flat category filters in cache keys', async () => {
      categoryRepository.findAndCountCategories.mockResolvedValue({
        categories: [baseCategory],
        totalCategories: 1,
      });
      cacheManager.get.mockImplementation((key: string) => {
        if (key === 'categories:version') return Promise.resolve(3);
        return Promise.resolve(undefined);
      });

      await service.getFlatCategories({
        page: 1,
        limit: 10,
        status: StatusTypeEnum.PUBLISHED,
        isActive: true,
        query: '  Electronics  ',
      });

      expect(categoryRepository.findAndCountCategories).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10,
        }),
      );
      expect(cacheManager.set).toHaveBeenCalledWith(
        'categories:v3:flat:page=1:limit=10:status=published:isActive=true:query=electronics',
        expect.any(Object),
        10 * 1000,
      );
    });

    it('should replace the category cache version after creating a category', async () => {
      const createCategoryDto = {
        name: 'Electronics',
        status: StatusTypeEnum.PUBLISHED,
      };
      categoryRepository.findCategoryByName.mockResolvedValue(null);
      categoryRepository.findCategoryBySlug.mockResolvedValue(null);
      categoryRepository.createCategory.mockResolvedValue(baseCategory);

      await service.createCategory(createCategoryDto);

      expect(cacheManager.set).toHaveBeenCalledWith(
        'categories:version',
        expect.any(String),
      );
    });
  });

  describe('createCategory', () => {
    it('should create a category when the name and generated slug are unique', async () => {
      const createCategoryDto = {
        name: 'Electronics',
        description: 'Gadgets and accessories',
        isActive: true,
        status: StatusTypeEnum.PUBLISHED,
      };
      categoryRepository.findCategoryByName.mockResolvedValue(null);
      categoryRepository.findCategoryBySlug.mockResolvedValue(null);
      categoryRepository.createCategory.mockResolvedValue(baseCategory);

      const result = await service.createCategory(createCategoryDto);

      expect(result).toEqual({
        message: 'Category created successfully.',
        id: 'category-id',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Gadgets and accessories',
        isActive: true,
        status: StatusTypeEnum.PUBLISHED,
        parentId: null,
      });
      expect(categoryRepository.createCategory).toHaveBeenCalledWith(
        createCategoryDto,
        'electronics',
      );
    });

    it('should create a child category when the parent category exists', async () => {
      const createCategoryDto = {
        name: 'Mobile Phones',
        parentId: 'parent-category-id',
        status: StatusTypeEnum.PUBLISHED,
      };
      const savedCategory = {
        ...baseCategory,
        id: 'child-category-id',
        name: 'Mobile Phones',
        slug: 'mobile-phones',
        parentId: 'parent-category-id',
      };
      categoryRepository.findCategoryById.mockResolvedValue(baseCategory);
      categoryRepository.findCategoryByName.mockResolvedValue(null);
      categoryRepository.findCategoryBySlug.mockResolvedValue(null);
      categoryRepository.createCategory.mockResolvedValue(savedCategory);

      const result = await service.createCategory(createCategoryDto);

      expect(result.parentId).toBe('parent-category-id');
      expect(categoryRepository.findCategoryById).toHaveBeenCalledWith(
        'parent-category-id',
      );
      expect(categoryRepository.createCategory).toHaveBeenCalledWith(
        createCategoryDto,
        'mobile-phones',
      );
    });

    it('should throw NotFoundException when the parent category does not exist', async () => {
      categoryRepository.findCategoryById.mockResolvedValue(null);

      await expect(
        service.createCategory({
          name: 'Mobile Phones',
          parentId: 'missing-parent-id',
        }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createCategory({
          name: 'Mobile Phones',
          parentId: 'missing-parent-id',
        }),
      ).rejects.toThrow('Parent category not found.');
      expect(categoryRepository.createCategory).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when a category with the same name exists', async () => {
      categoryRepository.findCategoryByName.mockResolvedValue(baseCategory);

      await expect(
        service.createCategory({ name: 'Electronics' }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.createCategory({ name: 'Electronics' }),
      ).rejects.toThrow('Category with this name already exists.');
      expect(categoryRepository.findCategoryBySlug).not.toHaveBeenCalled();
      expect(categoryRepository.createCategory).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the generated slug already exists', async () => {
      categoryRepository.findCategoryByName.mockResolvedValue(null);
      categoryRepository.findCategoryBySlug.mockResolvedValue(baseCategory);

      await expect(
        service.createCategory({ name: 'Electronics' }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.createCategory({ name: 'Electronics' }),
      ).rejects.toThrow('Category with this generated slug already exists.');
      expect(categoryRepository.createCategory).not.toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('should update category fields without regenerating slug when the name is unchanged', async () => {
      const updateCategoryDto = {
        description: 'Updated description',
        isActive: false,
      };
      const updatedCategory = {
        ...baseCategory,
        description: 'Updated description',
        isActive: false,
      };
      categoryRepository.findCategoryById.mockResolvedValue(baseCategory);
      categoryRepository.updateCategory.mockResolvedValue(updatedCategory);

      const result = await service.updateCategory(
        'category-id',
        updateCategoryDto,
      );

      expect(result).toEqual(updatedCategory);
      expect(categoryRepository.updateCategory).toHaveBeenCalledWith(
        'category-id',
        updateCategoryDto,
        undefined,
      );
      expect(categoryRepository.findCategoryByName).not.toHaveBeenCalled();
      expect(categoryRepository.findCategoryBySlug).not.toHaveBeenCalled();
    });

    it('should update the category slug when the category name changes', async () => {
      const updateCategoryDto = { name: 'Home Electronics' };
      const updatedCategory = {
        ...baseCategory,
        name: 'Home Electronics',
        slug: 'home-electronics',
      };
      categoryRepository.findCategoryById.mockResolvedValue(baseCategory);
      categoryRepository.findCategoryByName.mockResolvedValue(null);
      categoryRepository.findCategoryBySlug.mockResolvedValue(null);
      categoryRepository.updateCategory.mockResolvedValue(updatedCategory);

      const result = await service.updateCategory(
        'category-id',
        updateCategoryDto,
      );

      expect(result.slug).toBe('home-electronics');
      expect(categoryRepository.updateCategory).toHaveBeenCalledWith(
        'category-id',
        updateCategoryDto,
        'home-electronics',
      );
    });

    it('should update the parent category when the new parent exists', async () => {
      const updateCategoryDto = { parentId: 'parent-category-id' };
      const updatedCategory = {
        ...baseCategory,
        parentId: 'parent-category-id',
      };
      categoryRepository.findCategoryById
        .mockResolvedValueOnce(baseCategory)
        .mockResolvedValueOnce({ ...baseCategory, id: 'parent-category-id' });
      categoryRepository.updateCategory.mockResolvedValue(updatedCategory);

      const result = await service.updateCategory(
        'category-id',
        updateCategoryDto,
      );

      expect(result.parentId).toBe('parent-category-id');
      expect(categoryRepository.findCategoryById).toHaveBeenNthCalledWith(
        2,
        'parent-category-id',
      );
    });

    it('should throw NotFoundException when the category does not exist', async () => {
      categoryRepository.findCategoryById.mockResolvedValue(null);

      await expect(
        service.updateCategory('missing-category-id', {
          name: 'Home Electronics',
        }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateCategory('missing-category-id', {
          name: 'Home Electronics',
        }),
      ).rejects.toThrow('Category not found.');
      expect(categoryRepository.updateCategory).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when assigning a category as its own parent', async () => {
      categoryRepository.findCategoryById.mockResolvedValue(baseCategory);

      await expect(
        service.updateCategory('category-id', { parentId: 'category-id' }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.updateCategory('category-id', { parentId: 'category-id' }),
      ).rejects.toThrow('A category cannot be its own parent.');
      expect(categoryRepository.updateCategory).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the new parent category does not exist', async () => {
      categoryRepository.findCategoryById
        .mockResolvedValueOnce(baseCategory)
        .mockResolvedValueOnce(null);

      await expect(
        service.updateCategory('category-id', {
          parentId: 'missing-parent-id',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(categoryRepository.updateCategory).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when another category has the new name', async () => {
      categoryRepository.findCategoryById.mockResolvedValue(baseCategory);
      categoryRepository.findCategoryByName.mockResolvedValue({
        ...baseCategory,
        id: 'other-category-id',
      });

      await expect(
        service.updateCategory('category-id', { name: 'Home Electronics' }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.updateCategory('category-id', { name: 'Home Electronics' }),
      ).rejects.toThrow('Category with this name already exists.');
      expect(categoryRepository.findCategoryBySlug).not.toHaveBeenCalled();
      expect(categoryRepository.updateCategory).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when another category has the generated slug', async () => {
      categoryRepository.findCategoryById.mockResolvedValue(baseCategory);
      categoryRepository.findCategoryByName.mockResolvedValue(null);
      categoryRepository.findCategoryBySlug.mockResolvedValue({
        ...baseCategory,
        id: 'other-category-id',
        slug: 'home-electronics',
      });

      await expect(
        service.updateCategory('category-id', { name: 'Home Electronics' }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.updateCategory('category-id', { name: 'Home Electronics' }),
      ).rejects.toThrow('Category with this generated slug already exists.');
      expect(categoryRepository.updateCategory).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the repository cannot find the category after update', async () => {
      categoryRepository.findCategoryById.mockResolvedValue(baseCategory);
      categoryRepository.updateCategory.mockResolvedValue(null);

      await expect(
        service.updateCategory('category-id', {
          description: 'Updated description',
        }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateCategory('category-id', {
          description: 'Updated description',
        }),
      ).rejects.toThrow('Category not found after update.');
    });
  });

  describe('deleteCategory', () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('should delete a category when it exists and has no child categories', async () => {
      categoryRepository.findCategoryById.mockResolvedValue(baseCategory);
      categoryRepository.find.mockResolvedValue([]);
      categoryRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteCategory('category-id');

      expect(result).toEqual({
        id: 'category-id',
        message: 'Category deleted successfully.',
      });
      expect(categoryRepository.find).toHaveBeenCalledWith({
        where: { parentId: 'category-id' },
      });
      expect(categoryRepository.delete).toHaveBeenCalledWith('category-id');
    });

    it('should throw NotFoundException when the category does not exist', async () => {
      categoryRepository.findCategoryById.mockResolvedValue(null);

      await expect(
        service.deleteCategory('missing-category-id'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.deleteCategory('missing-category-id'),
      ).rejects.toThrow('Category not found.');
      expect(categoryRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the category has child categories', async () => {
      categoryRepository.findCategoryById.mockResolvedValue(baseCategory);
      categoryRepository.find.mockResolvedValue([
        { ...baseCategory, id: 'child-category-id', parentId: 'category-id' },
      ]);

      await expect(service.deleteCategory('category-id')).rejects.toThrow(
        ConflictException,
      );
      await expect(service.deleteCategory('category-id')).rejects.toThrow(
        'Deletion failed. Sub-categories exists for this parent.',
      );
      expect(categoryRepository.delete).not.toHaveBeenCalled();
    });
  });
});

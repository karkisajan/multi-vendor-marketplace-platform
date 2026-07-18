import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DatePostedTypeEnum } from 'src/common/enums/date-filters.enum';
import { ProductStatusEnum } from 'src/common/enums/product-status.enum';
import { CurrentUserContext } from 'src/modules/users/types/user.types';
import { ProductRepository } from '../repositories/product.repository';
import { ProductRatingRepository } from '../repositories/product-rating.repository';
import { CustomerProductService } from './customer-product.service';
import { Product } from '../entities/product.entity';
import { ProductRating } from '../entities/product-rating.entity';

describe('CustomerProductService', () => {
  let service: CustomerProductService;

  const cacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const productRepository = {
    createQueryBuilder: jest.fn(),
    findProductBySlug: jest.fn(),
    findProductById: jest.fn(),
  };

  const productRatingRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
  };

  const user: CurrentUserContext = {
    id: 'customer-id',
    email: 'customer@example.com',
    role: 'customer',
  } as CurrentUserContext;

  const buildQueryBuilderMock = () => {
    const qb: Record<string, jest.Mock> = {};

    [
      'leftJoin',
      'select',
      'addSelect',
      'andWhere',
      'where',
      'orderBy',
      'addOrderBy',
      'take',
    ].forEach((method) => {
      qb[method] = jest.fn().mockReturnThis();
    });

    qb.getRawAndEntities = jest.fn();
    qb.getOne = jest.fn();

    return qb;
  };

  const defaultProductList = [
    {
      id: 'product-1',
      name: 'Noise Cancelling Headphones',
      slug: 'noise-cancelling-headphones',
      createdAt: new Date('2026-07-15T10:00:00.000Z'),
      productVariants: [
        {
          id: 'variant-1',
          sellingPrice: 120,
          crossPrice: 150,
          productImages: [
            {
              id: 'image-1',
              imageUrl: 'https://example.com/image-1.jpg',
            },
          ],
        },
      ],
    },
    {
      id: 'product-2',
      name: 'Wireless Keyboard',
      slug: 'wireless-keyboard',
      createdAt: new Date('2026-07-14T10:00:00.000Z'),
      productVariants: [
        {
          id: 'variant-2',
          sellingPrice: 80,
          crossPrice: 100,
          productImages: [
            {
              id: 'image-2',
              imageUrl: 'https://example.com/image-2.jpg',
            },
          ],
        },
      ],
    },
  ] as Product[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerProductService,
        { provide: ProductRepository, useValue: productRepository },
        {
          provide: ProductRatingRepository,
          useValue: productRatingRepository,
        },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get<CustomerProductService>(CustomerProductService);

    jest.clearAllMocks();

    cacheManager.get.mockImplementation((key: string) => {
      if (key === 'products:version') {
        return Promise.resolve('1');
      }
      return Promise.resolve(undefined);
    });
    cacheManager.set.mockResolvedValue(undefined);
  });

  describe('getAllProductsCustomer', () => {
    it('should throw BadRequestException when limit is not a positive integer', async () => {
      await expect(
        service.getAllProductsCustomer({ limit: 0 }),
      ).rejects.toThrow(
        new BadRequestException('Limit should be of positive integer.'),
      );
    });

    it('should return cached product results when cache already contains the response', async () => {
      const cachedResponse = {
        message: 'Product fetched successfully.',
        data: [],
        meta: { hasNextPage: false, nextPageCursor: null },
      };

      cacheManager.get.mockImplementation((key: string) => {
        if (key === 'products:version') {
          return Promise.resolve('1');
        }

        return Promise.resolve(cachedResponse);
      });

      const result = await service.getAllProductsCustomer({ limit: 10 });

      expect(result).toEqual(cachedResponse);
      expect(productRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should return paginated products and cache the response when products are found', async () => {
      const qb = buildQueryBuilderMock();
      qb.getRawAndEntities.mockResolvedValue({
        entities: defaultProductList,
        raw: [
          { averageRatings: '4.5', totalReviews: '12' },
          { averageRatings: '4', totalReviews: '5' },
        ],
      });
      productRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getAllProductsCustomer({
        limit: 1,
        search: 'keyboard',
        categoryId: 'category-id',
        minPrice: 50,
        maxPrice: 150,
        datePosted: DatePostedTypeEnum.LAST_7_DAYS,
      });

      expect(result).toEqual({
        message: 'Product fetched successfully.',
        data: [
          {
            id: 'product-1',
            name: 'Noise Cancelling Headphones',
            slug: 'noise-cancelling-headphones',
            createdAt: new Date('2026-07-15T10:00:00.000Z'),
            averageRatings: 4.5,
            totalReviews: 12,
            productVariant: {
              id: 'variant-1',
              sellingPrice: 120,
              crossPrice: 150,
              productImage: {
                id: 'image-1',
                imageUrl: 'https://example.com/image-1.jpg',
              },
            },
          },
        ],
        meta: {
          hasNextPage: true,
          nextPageCursor: 'eyJjcmVhdGVkQXQiOiIyMDI2LTA3LTE1VDEwOjAwOjAwLjAwMFoiLCJpZCI6InByb2R1Y3QtMSJ9',
        },
      });

      expect(cacheManager.set).toHaveBeenCalledWith(
        'categories:customers:v:1:{"limit":1,"search":"keyboard","categoryId":"category-id","minPrice":50,"maxPrice":150,"datePosted":"last_7_days"}',
        result,
        10000,
      );
    });
  });

  describe('getProductBySlug', () => {
    it('should return cached product details when cache already contains the response', async () => {
      const cachedResponse = {
        message: 'Product fetched successfully.',
        data: { id: 'product-id' },
      };

      cacheManager.get.mockImplementation((key: string) => {
        if (key === 'products:version') {
          return Promise.resolve('1');
        }

        return Promise.resolve(cachedResponse);
      });

      const result = (await service.getProductBySlug(
        'wireless-keyboard',
      )) as any;

      expect(result).toEqual(cachedResponse);
      expect(productRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the product slug does not exist', async () => {
      const qb = buildQueryBuilderMock();
      qb.getOne.mockResolvedValue(null);
      productRepository.createQueryBuilder.mockReturnValue(qb);

      await expect(service.getProductBySlug('missing-product')).rejects.toThrow(
        new NotFoundException('Product not found.'),
      );
    });

    it('should return the product details and cache the response when the product is published', async () => {
      const qb = buildQueryBuilderMock();
      qb.getOne.mockResolvedValue({
        id: 'product-id',
        name: 'Wireless Keyboard',
        description: 'Compact keyboard with backlight',
        slug: 'wireless-keyboard',
        createdAt: new Date('2026-07-15T10:00:00.000Z'),
        productVariants: [
          {
            id: 'variant-1',
            sellingPrice: 120,
            crossPrice: 150,
            stockQuantity: 10,
            variantAttributes: { color: 'black' },
            productImages: [
              {
                id: 'image-1',
                imageUrl: 'https://example.com/image-1.jpg',
              },
            ],
          },
        ],
        productSpecifications: [
          { id: 'spec-1', key: 'Battery', value: '10 hours' },
        ],
        user: {
          id: 'vendor-id',
          email: 'vendor@example.com',
          vendorProfile: {
            businessName: 'Acme Corp',
            businessProfileUrl: 'https://example.com/business.jpg',
          },
        },
        category: {
          id: 'category-id',
          name: 'Accessories',
        },
      });
      productRepository.createQueryBuilder.mockReturnValue(qb);

      const response = (await service.getProductBySlug(
        'wireless-keyboard',
      )) as any;

      expect(response).toEqual({
        message: 'Product fetched successfully.',
        data: {
          id: 'product-id',
          name: 'Wireless Keyboard',
          slug: 'wireless-keyboard',
          description: 'Compact keyboard with backlight',
          productVariants: [
            {
              id: 'variant-1',
              sellingPrice: 120,
              crossPrice: 150,
              stockQuantity: 10,
              variantAttributes: { color: 'black' },
              productImages: [
                {
                  id: 'image-1',
                  imageUrl: 'https://example.com/image-1.jpg',
                },
              ],
            },
          ],
          productSpecifications: [
            { id: 'spec-1', key: 'Battery', value: '10 hours' },
          ],
          vendorProfile: {
            id: 'vendor-id',
            email: 'vendor@example.com',
            businessName: 'Acme Corp',
            businessProfileUrl: 'https://example.com/business.jpg',
          },
          category: {
            id: 'category-id',
            name: 'Accessories',
          },
        },
      });

      expect(cacheManager.set).toHaveBeenCalledWith(
        'products:customer:v1:{"slug":"wireless-keyboard"}',
        response.data,
        10000,
      );
    });
  });

  describe('getSimilarProducts', () => {
    it('should throw NotFoundException when the source product does not exist', async () => {
      productRepository.findProductBySlug.mockResolvedValue(null);

      await expect(service.getSimilarProducts('missing-product')).rejects.toThrow(
        new NotFoundException('Product not found.'),
      );
    });

    it('should return similar products and cache the response when matches exist', async () => {
      const qb = buildQueryBuilderMock();
      qb.getRawAndEntities.mockResolvedValue({
        entities: [
          {
            ...defaultProductList[0],
          },
        ],
        raw: [{ averageRatings: '4.5', totalReviews: '12' }],
      });
      productRepository.findProductBySlug.mockResolvedValue({
        id: 'source-product',
        categoryId: 'category-id',
      } as Product);
      productRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getSimilarProducts('source-product');

      expect(result).toEqual({
        message: 'Similar products fetched successfully.',
        data: [
          {
            id: 'product-1',
            name: 'Noise Cancelling Headphones',
            slug: 'noise-cancelling-headphones',
            createdAt: new Date('2026-07-15T10:00:00.000Z'),
            averageRatings: 4.5,
            totalReviews: 12,
            productVariant: {
              id: 'variant-1',
              sellingPrice: 120,
              crossPrice: 150,
              stockQuantity: undefined,
              variantAttributes: undefined,
              productImage: {
                id: 'image-1',
                imageUrl: 'https://example.com/image-1.jpg',
              },
            },
          },
        ],
      });

      expect(cacheManager.set).toHaveBeenCalledWith(
        'products:customer:v:1:{"slug":"source-product"}',
        result,
        10000,
      );
    });
  });

  describe('createRating', () => {
    it('should throw NotFoundException when the product is missing or unpublished', async () => {
      productRepository.findProductById.mockResolvedValue(null);

      await expect(
        service.createRating(
          'product-id',
          { score: 5, comment: 'Great product' },
          user,
        ),
      ).rejects.toThrow(new NotFoundException('Product not found.'));
    });

    it('should throw ConflictException when the customer already rated the product', async () => {
      productRepository.findProductById.mockResolvedValue({
        id: 'product-id',
        status: ProductStatusEnum.PUBLISHED,
      } as Product);
      productRatingRepository.findOne.mockResolvedValue({
        id: 'rating-id',
      } as ProductRating);

      await expect(
        service.createRating(
          'product-id',
          { score: 5, comment: 'Great product' },
          user,
        ),
      ).rejects.toThrow(
        new ConflictException('You have already rated this product.'),
      );
    });

    it('should create and return a new rating when the product is published', async () => {
      productRepository.findProductById.mockResolvedValue({
        id: 'product-id',
        status: ProductStatusEnum.PUBLISHED,
      } as Product);
      productRatingRepository.findOne.mockResolvedValue(null);
      productRatingRepository.create.mockReturnValue({
        id: 'rating-id',
        productId: 'product-id',
        customerId: 'customer-id',
        score: 5,
        comment: 'Great product',
      });
      productRatingRepository.save.mockResolvedValue({
        id: 'rating-id',
        productId: 'product-id',
        score: 5,
        comment: 'Great product',
        createdAt: new Date('2026-07-16T10:00:00.000Z'),
      });

      const result = await service.createRating(
        'product-id',
        { score: 5, comment: 'Great product' },
        user,
      );

      expect(productRatingRepository.create).toHaveBeenCalledWith({
        productId: 'product-id',
        customerId: 'customer-id',
        score: 5,
        comment: 'Great product',
      });
      expect(result).toEqual({
        message: 'Rating added successfully.',
        data: {
          id: 'rating-id',
          score: 5,
          comment: 'Great product',
          productId: 'product-id',
          createdAt: new Date('2026-07-16T10:00:00.000Z'),
        },
      });
    });
  });

  describe('updateRating', () => {
    it('should throw NotFoundException when the rating does not exist', async () => {
      productRatingRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateRating('rating-id', { score: 4 }, user),
      ).rejects.toThrow(new NotFoundException('Rating not found.'));
    });

    it('should throw ForbiddenException when the customer does not own the rating', async () => {
      productRatingRepository.findOne.mockResolvedValue({
        id: 'rating-id',
        customerId: 'another-customer',
      } as ProductRating);

      await expect(
        service.updateRating('rating-id', { score: 4 }, user),
      ).rejects.toThrow(
        new ForbiddenException('You can only update your own ratings.'),
      );
    });

    it('should update and return the rating when the customer owns it', async () => {
      productRatingRepository.findOne.mockResolvedValue({
        id: 'rating-id',
        customerId: 'customer-id',
        productId: 'product-id',
        score: 3,
        comment: 'Okay',
      } as ProductRating);
      productRatingRepository.save.mockResolvedValue({
        id: 'rating-id',
        customerId: 'customer-id',
        productId: 'product-id',
        score: 4,
        comment: 'Better after use',
        updatedAt: new Date('2026-07-17T10:00:00.000Z'),
      });

      const result = await service.updateRating(
        'rating-id',
        { score: 4, comment: 'Better after use' },
        user,
      );

      expect(result).toEqual({
        message: 'Rating updated successfully.',
        data: {
          id: 'rating-id',
          score: 4,
          comment: 'Better after use',
          productId: 'product-id',
          updatedAt: new Date('2026-07-17T10:00:00.000Z'),
        },
      });
    });
  });

  describe('deleteRating', () => {
    it('should throw NotFoundException when the rating does not exist', async () => {
      productRatingRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteRating('rating-id', user)).rejects.toThrow(
        new NotFoundException('Rating not found.'),
      );
    });

    it('should throw ForbiddenException when the customer does not own the rating', async () => {
      productRatingRepository.findOne.mockResolvedValue({
        id: 'rating-id',
        customerId: 'another-customer',
      } as ProductRating);

      await expect(service.deleteRating('rating-id', user)).rejects.toThrow(
        new ForbiddenException('You can only delete your own ratings.'),
      );
    });

    it('should delete the rating when the customer owns it', async () => {
      const rating = {
        id: 'rating-id',
        customerId: 'customer-id',
      } as ProductRating;
      productRatingRepository.findOne.mockResolvedValue(rating);

      const result = await service.deleteRating('rating-id', user);

      expect(productRatingRepository.softRemove).toHaveBeenCalledWith(rating);
      expect(result).toEqual({
        message: 'Rating deleted successfully.',
      });
    });
  });
});

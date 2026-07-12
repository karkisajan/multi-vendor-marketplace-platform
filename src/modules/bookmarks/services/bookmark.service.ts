import { Injectable, NotFoundException } from '@nestjs/common';
import { BookmarkTypeEnum } from 'src/common/enums/bookmark-type.enum';
import { ProductRepository } from 'src/modules/products/repositories/product.repository';
import { UserRepository } from 'src/modules/users/repositories/user.repository';
import { VendorProfileRepository } from 'src/modules/users/repositories/vendor-profile.repository';
import { CurrentUserContext } from 'src/modules/users/types/user.types';
import { CreateBookmarkDto } from '../dto/create-bookmark.dto';
import { BookmarkRepository } from '../repositories/bookmark.repository';
import { User } from 'src/modules/users/entities/user.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { Bookmark } from '../entities/bookmark.entity';
import { ProductStatusEnum } from 'src/common/enums/product-status.enum';
import { ProductVariant } from 'src/modules/products/entities/product-variant.entity';
import { ProductImage } from 'src/modules/products/entities/product-image.entity';
import { VendorProfile } from 'src/modules/users/entities/vendor-profile.entity';

@Injectable()
export class BookmarkService {
  constructor(
    private readonly bookmarkRepository: BookmarkRepository,
    private readonly userRepository: UserRepository,
    private readonly productRepository: ProductRepository,
    private readonly vendorProfileRepository: VendorProfileRepository,
  ) {}

  async createBookmark(
    currentUser: CurrentUserContext,
    createBookmarkDto: CreateBookmarkDto,
  ) {
    const customer: User | null = await this.userRepository.findUserById(
      currentUser.id,
    );

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    /**
     * -- POST - create a BOOKMARK TYPE Product
     * -- If bookmark already exists - remove it from Database and vice versa
     */
    if (createBookmarkDto.bookmarkType === BookmarkTypeEnum.PRODUCT) {
      const product: Product | null =
        await this.productRepository.findProductById(
          createBookmarkDto.productId,
        );

      if (!product) {
        throw new NotFoundException('Product not found.');
      }

      const existingBookmark: boolean =
        await this.bookmarkRepository.findBookmarkByTarget(
          customer.id,
          createBookmarkDto.bookmarkType,
          createBookmarkDto.productId,
        );

      if (existingBookmark) {
        const removedBookmark = await this.bookmarkRepository.deleteBookmark(
          customer.id,
          createBookmarkDto.bookmarkType,
          createBookmarkDto.productId,
          undefined,
        );

        if (removedBookmark.affected === 1) {
          return {
            message: 'Bookmark removed successfully.',
          };
        }
      }

      const bookmark = await this.bookmarkRepository.createBookmark(
        customer.id,
        createBookmarkDto.bookmarkType,
        createBookmarkDto.productId,
      );

      return {
        message: 'Product bookmarked successfully.',
        bookmark: bookmark,
      };
    }

    /**
     * -- POST - create a BOOKMARK TYPE Business (Vendor)
     * -- If bookmark already exists - remove it from Database and vice versa
     */
    if (createBookmarkDto.bookmarkType === BookmarkTypeEnum.BUSINESS) {
      const vendor: User | null = await this.userRepository.findOne({
        where: { id: createBookmarkDto.vendorId },
      });
      if (!vendor) {
        throw new NotFoundException('Vendor not found.');
      }

      const existingBookmark: boolean =
        await this.bookmarkRepository.findBookmarkByTarget(
          customer.id,
          createBookmarkDto.bookmarkType,
          createBookmarkDto.vendorId,
        );

      if (existingBookmark) {
        const removedBookmark = await this.bookmarkRepository.deleteBookmark(
          customer.id,
          createBookmarkDto.bookmarkType,
          undefined,
          createBookmarkDto.vendorId,
        );

        if (removedBookmark.affected === 1) {
          return {
            message: 'Bookmark removed successfully.',
          };
        }
      }

      const bookmark = await this.bookmarkRepository.createBookmark(
        customer.id,
        createBookmarkDto.bookmarkType,
        undefined,
        createBookmarkDto.vendorId,
      );

      return {
        message: 'Business bookmarked successfully.',
        bookmark,
      };
    }
  }

  async getBookmarksOfCustomers(
    currentUser: CurrentUserContext,
    bookmarkType: BookmarkTypeEnum,
  ) {
    const bookmarkBaseQuery = this.bookmarkRepository
      .createQueryBuilder('bookmark')
      .leftJoin('bookmark.product', 'product', 'product.status = :status', {
        status: ProductStatusEnum.PUBLISHED,
      })
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
      .leftJoin('bookmark.vendor', 'vendor')
      .leftJoin('vendor.vendorProfile', 'vendorProfile')
      .select([
        'bookmark.id',
        'bookmark.bookmarkType',
        'product.id',
        'product.name',
        'product.description',
        'productVariant.id',
        'productVariant.sellingPrice',
        'productVariant.crossPrice',
        'productVariant.stockQuantity',
        'productImage.id',
        'productImage.imageUrl',
        'vendor.id',
        'vendor.email',
        'vendorProfile.id',
        'vendorProfile.businessName',
        'vendorProfile.businessProfileUrl',
      ]);

    const bookmarkedData: Bookmark[] = await bookmarkBaseQuery
      .andWhere('bookmark.customerId = :customerId', {
        customerId: currentUser.id,
      })
      .getMany();

    const refinedBookmarkedProductsData = bookmarkedData
      .filter((bookmark) => bookmark.bookmarkType === BookmarkTypeEnum.PRODUCT)
      .map((bookmark: Bookmark) => {
        const productVariant: ProductVariant | undefined =
          bookmark.product?.productVariants[0];
        const productImage: ProductImage | undefined =
          productVariant?.productImages[0];

        return {
          type: BookmarkTypeEnum.PRODUCT,
          id: bookmark.product?.id,
          name: bookmark.product?.name,
          description: bookmark.product?.description,
          productVariant: productVariant
            ? {
                id: productVariant.id,
                sellingPrice: productVariant.sellingPrice,
                crossPrice: productVariant.crossPrice,
                stockQuantity: productVariant.stockQuantity,
              }
            : null,
          productImage: productImage
            ? {
                id: productImage.id,
                imageUrl: productImage.imageUrl,
              }
            : null,
        };
      });

    const refinedBookmarkedVendorProfileData = bookmarkedData
      .filter((bookmark) => bookmark.bookmarkType === BookmarkTypeEnum.BUSINESS)
      .map((bookmark: Bookmark) => {
        const vendor: User = bookmark.vendor;
        const vendorProfile: VendorProfile = vendor?.vendorProfile;

        return {
          type: BookmarkTypeEnum.BUSINESS,
          id: vendor.id,
          email: vendor.email,
          vendorProfile: {
            id: vendorProfile.id,
            businessName: vendorProfile.businessName,
            businessProfileUrl: vendorProfile.businessProfileUrl,
          },
        };
      });

    const result = [
      ...refinedBookmarkedProductsData,
      ...refinedBookmarkedVendorProfileData,
    ];

    return result.length === 0
      ? {
          message: 'No bookmarks yet.',
          data: [],
        }
      : {
          message: 'Bookmarks fetched successfully.',
          data: result,
        };
  }
}

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookmarkTypeEnum } from 'src/common/enums/bookmark-type.enum';
import { ProductRepository } from 'src/modules/products/repositories/product.repository';
import { UserRepository } from 'src/modules/users/repositories/user.repository';
import { VendorProfileRepository } from 'src/modules/users/repositories/vendor-profile.repository';
import { CurrentUserContext } from 'src/modules/users/types/user.types';
import { CreateBookmarkDto } from '../dto/create-bookmark.dto';
import { BookmarkRepository } from '../repositories/bookmark.repository';
import { User } from 'src/modules/users/entities/user.entity';
import { Product } from 'src/modules/products/entities/product.entity';

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
    const user: User | null = await this.userRepository.findUserById(
      currentUser.id,
    );

    if (!user?.customerProfile) {
      throw new ForbiddenException('Customer profile not found.');
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
          user?.customerProfile.id,
          createBookmarkDto.bookmarkType,
          createBookmarkDto.productId,
        );

      if (existingBookmark) {
        await this.bookmarkRepository.deleteBookmark(
          user?.customerProfile.id,
          createBookmarkDto.bookmarkType,
          createBookmarkDto.productId,
          undefined,
        );
      }

      const bookmark = await this.bookmarkRepository.createBookmark(
        user?.customerProfile.id,
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
      const vendorProfile = await this.vendorProfileRepository.findOne({
        where: { id: createBookmarkDto.vendorProfileId },
      });
      if (!vendorProfile) {
        throw new NotFoundException('Vendor business not found.');
      }

      const existingBookmark: boolean =
        await this.bookmarkRepository.findBookmarkByTarget(
          user?.customerProfile.id,
          createBookmarkDto.bookmarkType,
          createBookmarkDto.vendorProfileId,
        );

      if (existingBookmark) {
        await this.bookmarkRepository.deleteBookmark(
          user?.customerProfile.id,
          createBookmarkDto.bookmarkType,
          undefined,
          createBookmarkDto.vendorProfileId,
        );
      }

      const bookmark = await this.bookmarkRepository.createBookmark(
        user?.customerProfile.id,
        createBookmarkDto.bookmarkType,
        undefined,
        createBookmarkDto.vendorProfileId,
      );

      return {
        message: 'Business bookmarked successfully.',
        bookmark,
      };
    }
  }
}

import { Injectable } from '@nestjs/common';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { Bookmark } from '../entities/bookmark.entity';
import { BookmarkTypeEnum } from 'src/common/enums/bookmark-type.enum';

@Injectable()
export class BookmarkRepository extends Repository<Bookmark> {
  constructor(dataSource: DataSource) {
    super(Bookmark, dataSource.createEntityManager());
  }

  async findBookmarkByTarget(
    customerId: string,
    bookmarkType: BookmarkTypeEnum,
    targetId: string,
  ): Promise<boolean> {
    const whereCondition: FindOptionsWhere<Bookmark> =
      bookmarkType === BookmarkTypeEnum.PRODUCT
        ? { customerId, bookmarkType, productId: targetId }
        : { customerId, bookmarkType, vendorProfileId: targetId };

    return await this.exists({ where: whereCondition });
  }

  async createBookmark(
    customerId: string,
    bookmarkType: BookmarkTypeEnum,
    productId?: string,
    vendorProfileId?: string,
  ): Promise<Bookmark> {
    const bookmark = this.create({
      customerId,
      bookmarkType,
      productId: productId ?? null,
      vendorProfileId: vendorProfileId ?? null,
    });

    return await this.save(bookmark);
  }

  async deleteBookmark(
    customerId: string,
    bookmarkType: BookmarkTypeEnum,
    productId?: string,
    vendorProfileId?: string,
  ): Promise<void> {
    const whereCondition: FindOptionsWhere<Bookmark> = {
      customerId: customerId,
      bookmarkType: bookmarkType,
    };

    if (productId) {
      whereCondition.productId = productId;
    }

    if (vendorProfileId) {
      whereCondition.vendorProfileId = vendorProfileId;
    }

    await this.delete(whereCondition);
  }
}

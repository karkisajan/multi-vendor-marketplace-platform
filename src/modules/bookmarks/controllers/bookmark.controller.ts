import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { CurrentUserContext } from 'src/modules/users/types/user.types';
import { CreateBookmarkDto } from '../dto/create-bookmark.dto';
import { BookmarkService } from '../services/bookmark.service';
import { BookmarkTypeEnum } from 'src/common/enums/bookmark-type.enum';

@ApiTags('Customer Bookmarks')
@Controller('/bookmarks')
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post()
  async createBookmark(
    @GetCurrentUser() currentUser: CurrentUserContext,
    @Body() createBookmarkDto: CreateBookmarkDto,
  ) {
    return await this.bookmarkService.createBookmark(
      currentUser,
      createBookmarkDto,
    );
  }

  @Get('/')
  async getBookmarksOfCustomers(
    @GetCurrentUser() currentUser: CurrentUserContext,
    @Query('bookmarkType') bookmarkType: BookmarkTypeEnum,
  ) {
    return await this.bookmarkService.getBookmarksOfCustomers(
      currentUser,
      bookmarkType,
    );
  }
}

import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { CurrentUserContext } from 'src/modules/users/types/user.types';
import { CreateBookmarkDto } from '../dto/create-bookmark.dto';
import { BookmarkService } from '../services/bookmark.service';

@ApiTags('Customer Bookmarks')
@Controller('/customers/bookmarks')
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
}

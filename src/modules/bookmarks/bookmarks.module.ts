import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bookmark } from './entities/bookmark.entity';
import { BookmarkRepository } from './repositories/bookmark.repository';
import { BookmarkService } from './services/bookmark.service';
import { BookmarkController } from './controllers/bookmark.controller';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [TypeOrmModule.forFeature([Bookmark]), UsersModule, ProductsModule],
  controllers: [BookmarkController],
  providers: [BookmarkRepository, BookmarkService],
  exports: [BookmarkRepository, BookmarkService],
})
export class BookmarksModule {}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CustomerProductService } from '../services/customer-product.service';
import {
  ApiCustomerGetAllProducts,
  ApiCustomerGetProductBySlug,
  ApiCustomerGetSimilarProducts,
  ApiCustomerCreateRating,
  ApiCustomerUpdateRating,
  ApiCustomerDeleteRating,
} from '../decorators/customer-product-swagger.decorator';
import { DatePostedTypeEnum } from 'src/common/enums/date-filters.enum';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { CurrentUserContext } from 'src/modules/users/types/user.types';
import { CreateProductRatingDto } from '../dto/customer/create-product-rating.dto';
import { UpdateProductRatingDto } from '../dto/customer/update-product-rating.dto';

@ApiTags('Customer Products')
@Controller('/products')
export class CustomerProductController {
  constructor(
    private readonly customerProductService: CustomerProductService,
  ) {}

  /**
   * ------ GET - Fetch all products (Customer)
   * Returns a paginated list of published products with optional search and price filters.
   * Reuses cached results when possible to keep customer browsing fast.
   */
  @ApiCustomerGetAllProducts()
  @Get('/')
  async getAllProductsCustomer(
    @Query('limit') limit: number,
    @Query('cursor') cursor?: string,
    @Query('search') search?: string,
    @Query('categorySlug') categorySlug?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('datePosted') datePosted?: DatePostedTypeEnum,
  ) {
    return await this.customerProductService.getAllProductsCustomer({
      limit: limit,
      cursor: cursor,
      search: search,
      categorySlug: categorySlug,
      minPrice: minPrice,
      maxPrice: maxPrice,
      datePosted: datePosted,
    });
  }

  /**
   * ------ GET - Fetch product by slug (Customer)
   * Returns the full public product detail view for a published product identified by slug.
   */
  @ApiCustomerGetProductBySlug()
  @Get('/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    return await this.customerProductService.getProductBySlug(slug);
  }

  /**
   * ------ GET - Fetch similar products (Customer)
   * Returns up to ten products from the same category as the requested product.
   */
  @ApiCustomerGetSimilarProducts()
  @Get('/similar-products/:slug')
  async getSimilarProducts(@Param('slug') slug: string) {
    return await this.customerProductService.getSimilarProducts(slug);
  }

  /**
   * ------ POST - Create product rating (Customer)
   * Submits a score and optional comment for a published product.
   * Rejects duplicates — each customer can rate a product only once.
   */
  @ApiCustomerCreateRating()
  @Post('/:productId/ratings')
  async createRating(
    @Param('productId') productId: string,
    @GetCurrentUser() user: CurrentUserContext,
    @Body() createProductRatingDto: CreateProductRatingDto,
  ) {
    return await this.customerProductService.createRating(
      productId,
      createProductRatingDto,
      user,
    );
  }

  /**
   * ------ PATCH - Update own product rating (Customer)
   * Allows the rating owner to modify their score and/or comment.
   */
  @ApiCustomerUpdateRating()
  @Patch('/ratings/:id')
  async updateRating(
    @Param('id') id: string,
    @GetCurrentUser() user: CurrentUserContext,
    @Body() updateProductRatingDto: UpdateProductRatingDto,
  ) {
    return await this.customerProductService.updateRating(
      id,
      updateProductRatingDto,
      user,
    );
  }

  /**
   * ------ DELETE - Delete own product rating (Customer)
   * Soft-deletes the rating so it no longer appears in public queries.
   */
  @ApiCustomerDeleteRating()
  @Delete('/ratings/:id')
  async deleteRating(
    @Param('id') id: string,
    @GetCurrentUser() user: CurrentUserContext,
  ) {
    return await this.customerProductService.deleteRating(id, user);
  }
}

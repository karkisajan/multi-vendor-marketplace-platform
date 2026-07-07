import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CustomerProductService } from '../services/customer-product.service';
import {
  ApiCustomerGetAllProducts,
  ApiCustomerGetProductBySlug,
  ApiCustomerGetSimilarProducts,
} from '../decorators/customer-product-swagger.decorator';

@ApiTags('Customer Products')
@Controller('/customers/products')
export class CustomerProductController {
  constructor(
    private readonly CustomerProductService: CustomerProductService,
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
    @Query('maxPrice') maxPrice?: number,
    @Query('minPrice') minPrice?: number,
  ) {
    return await this.CustomerProductService.getAllProductsCustomer({
      limit: limit,
      cursor: cursor,
      search: search,
      maxPrice: maxPrice,
      minPrice: minPrice,
    });
  }

  /**
   * ------ GET - Fetch product by slug (Customer)
   * Returns the full public product detail view for a published product identified by slug.
   */
  @ApiCustomerGetProductBySlug()
  @Get('/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    return await this.CustomerProductService.getProductBySlug(slug);
  }

  /**
   * ------ GET - Fetch similar products (Customer)
   * Returns up to ten products from the same category as the requested product.
   */
  @ApiCustomerGetSimilarProducts()
  @Get('/similar-products/:slug')
  async getSimilarProducts(@Param('slug') slug: string) {
    return await this.CustomerProductService.getSimilarProducts(slug);
  }
}

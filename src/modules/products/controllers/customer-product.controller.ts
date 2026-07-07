import { Controller, Get, Param, Query } from '@nestjs/common';
import { CustomerProductService } from '../services/customer-product.service';

@Controller('/customers/products')
export class CustomerProductController {
  constructor(
    private readonly CustomerProductService: CustomerProductService,
  ) {}

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

  @Get('/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    return await this.CustomerProductService.getProductBySlug(slug);
  }

  @Get('/similar-products/:slug')
  async getSimilarProducts(@Param('slug') slug: string) {
    return await this.CustomerProductService.getSimilarProducts(slug);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ProductService } from '../services/product.service';

@Controller('/customers/products')
export class CustomerProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('/')
  async getAllProductsCustomer(
    @Query('limit') limit: number,
    @Query('cursor') cursor?: string,
    @Query('search') search?: string,
    @Query('maxPrice') maxPrice?: number,
    @Query('minPrice') minPrice?: number,
  ) {
    return await this.productService.getAllProductsCustomer({
      limit: limit,
      cursor: cursor,
      search: search,
      maxPrice: maxPrice,
      minPrice: minPrice,
    });
  }
}

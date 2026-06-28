import { Body, Controller, Delete, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { UpdateProductStatusDto } from '../dto/admin/update-product-status.dto';
import { AdminUpdateProductDto } from '../dto/admin/admin-update-product.dto';
import {
  ApiAdminDeleteProduct,
  ApiAdminUpdateProduct,
  ApiAdminUpdateProductStatus,
} from '../decorators/product-swagger.decorator';

@ApiTags('Admin Products')
@Controller('/admin/products')
export class AdminProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * ------ PUT - Update product status
   * Publishes, rejects, or archives a product with an optional review note.
   */
  @ApiAdminUpdateProductStatus()
  @Put('/:id/status')
  async updateProductStatus(
    @Param('id') id: string,
    @Body() updateProductStatusDto: UpdateProductStatusDto,
  ) {
    return this.productService.adminUpdateProductStatus(
      id,
      updateProductStatusDto,
    );
  }

  /**
   * ------ PUT - Force-edit product
   * Allows admin to update any field on any product, including status.
   */
  @ApiAdminUpdateProduct()
  @Put('/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() adminUpdateProductDto: AdminUpdateProductDto,
  ) {
    return this.productService.adminUpdateProduct(id, adminUpdateProductDto);
  }

  /**
   * ------ DELETE - Hard delete product
   * Permanently removes a product regardless of its status.
   */
  @ApiAdminDeleteProduct()
  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    return this.productService.adminDeleteProduct(id);
  }
}

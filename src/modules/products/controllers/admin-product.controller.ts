import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { UpdateProductStatusDto } from '../dto/admin/update-product-status.dto';
import { AdminUpdateProductDto } from '../dto/admin/admin-update-product.dto';
import {
  ApiAdminUpdateProduct,
  ApiAdminUpdateProductStatus,
} from '../decorators/product-swagger.decorator';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { CurrentUserContext } from 'src/modules/users/types/user.types';

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
    @GetCurrentUser() user: CurrentUserContext,
  ) {
    return this.productService.adminUpdateProductStatus(
      id,
      updateProductStatusDto,
      user,
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
    @GetCurrentUser() user: CurrentUserContext,
  ) {
    return this.productService.adminUpdateProduct(
      id,
      adminUpdateProductDto,
      user,
    );
  }
}

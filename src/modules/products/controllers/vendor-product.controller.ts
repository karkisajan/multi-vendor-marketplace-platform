import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { CurrentUserContext } from 'src/modules/users/types/user.types';
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../dto/vendor/create-product.dto';
import { UpdateProductDto } from '../dto/vendor/update-product.dto';
import { CreateProductVariantDto } from '../dto/vendor/create-product-variant.dto';
import { UpdateProductVariantDto } from '../dto/vendor/update-product-variant.dto';
import {
  ApiVendorCreateProduct,
  ApiVendorCreateVariant,
  ApiVendorDeleteProduct,
  ApiVendorDeleteVariant,
  ApiVendorUpdateProduct,
  ApiVendorUpdateVariant,
} from '../decorators/product-swagger.decorator';

@ApiTags('Vendor Products')
@Controller('/vendor/products')
export class VendorProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * ------ POST - Create product
   * Creates a new product for the authenticated vendor with DRAFT status.
   */
  @ApiVendorCreateProduct()
  @Post()
  async createProduct(
    @GetCurrentUser() user: CurrentUserContext,
    @Body() createProductDto: CreateProductDto,
  ) {
    console.log('The controller has been hit....');
    return this.productService.createProduct(createProductDto, user.id);
  }

  /**
   * ------ PUT - Update product
   * Updates name, description, and category on a product owned by the vendor.
   * Status is never modifiable through this endpoint.
   */
  @ApiVendorUpdateProduct()
  @Put('/:id')
  async updateProduct(
    @GetCurrentUser() user: CurrentUserContext,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.updateProduct(id, updateProductDto, user.id);
  }

  /**
   * ------ DELETE - Delete product
   * Deletes a DRAFT product owned by the authenticated vendor.
   */
  @ApiVendorDeleteProduct()
  @Delete('/:id')
  async deleteProduct(
    @GetCurrentUser() user: CurrentUserContext,
    @Param('id') id: string,
  ) {
    return this.productService.deleteProduct(id, user.id);
  }

  /**
   * ------ POST - Create variant
   * Adds a variant with price and attributes to a product owned by the vendor.
   */
  @ApiVendorCreateVariant()
  @Post('/:id/variants')
  async createVariant(
    @GetCurrentUser() user: CurrentUserContext,
    @Param('id') id: string,
    @Body() createProductVariantDto: CreateProductVariantDto,
  ) {
    return this.productService.createVariant(
      id,
      createProductVariantDto,
      user.id,
    );
  }

  /**
   * ------ PUT - Update variant
   * Updates price, stock, and attributes on a variant owned by the vendor.
   */
  @ApiVendorUpdateVariant()
  @Put('variants/:variantId')
  async updateVariant(
    @GetCurrentUser() user: CurrentUserContext,
    @Param('variantId') variantId: string,
    @Body() updateProductVariantDto: UpdateProductVariantDto,
  ) {
    return this.productService.updateVariant(
      variantId,
      updateProductVariantDto,
      user.id,
    );
  }

  /**
   * ------ DELETE - Delete variant
   * Removes a variant from a product, keeping at least one variant on the product.
   */
  @ApiVendorDeleteVariant()
  @Delete('variants/:variantId')
  async deleteVariant(
    @GetCurrentUser() user: CurrentUserContext,
    @Param('variantId') variantId: string,
  ) {
    return this.productService.deleteVariant(variantId, user.id);
  }
}

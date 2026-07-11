import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VendorProductService } from '../services/vendor-product.service';
import {
  ApiVendorCreateProduct,
  ApiVendorCreateVariant,
  ApiVendorDeleteProduct,
  ApiVendorDeleteVariant,
  ApiVendorUpdateProduct,
  ApiVendorUpdateVariant,
  ApiVendorGetAllProducts,
  ApiVendorGetProductById,
  ApiVendorCreateSpecification,
  ApiVendorGetSpecifications,
  ApiVendorGetSpecificationById,
  ApiVendorUpdateSpecification,
  ApiVendorDeleteSpecification,
} from '../decorators/product-swagger.decorator';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { CurrentUserContext } from 'src/modules/users/types/user.types';
import { CreateProductDto } from '../dto/vendor/create-product.dto';
import { UpdateProductDto } from '../dto/vendor/update-product.dto';
import { CreateProductVariantDto } from '../dto/vendor/create-product-variant.dto';
import { UpdateProductVariantDto } from '../dto/vendor/update-product-variant.dto';
import { CreateProductSpecificationDto } from '../dto/vendor/create-product-specification.dto';
import { UpdateProductSpecificationDto } from '../dto/vendor/update-product-specification.dto';
import { ProductStatusEnum } from 'src/common/enums/product-status.enum';

@ApiTags('Vendor Products')
@Controller('/vendor/products')
export class VendorProductController {
  constructor(private readonly productService: VendorProductService) {}

  /**
   * ------ GET - Fetch all products (Vendor)
   * Retrieves a paginated list of all products owned by the authenticated vendor with optional filters.
   */
  @ApiVendorGetAllProducts()
  @Get('/')
  async getAllProductsAdmin(
    @GetCurrentUser() user: CurrentUserContext,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: ProductStatusEnum,
  ) {
    const vendorId: string = user.id;
    return await this.productService.getAllProductsVendor({
      vendorId,
      page,
      limit,
      search,
      categoryId,
      status,
    });
  }

  /**
   * ------ GET - Fetch product by ID (Vendor)
   * Retrieves detailed product information for a specific product owned by the vendor.
   */
  @ApiVendorGetProductById()
  @Get('/:id')
  async getProductByIdAdmin(
    @GetCurrentUser() user: CurrentUserContext,
    @Param('id') id: string,
  ) {
    return await this.productService.getProductByIdVendor({
      id: id,
      vendorId: user.id,
    });
  }

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

  /**
   * ------ POST - Create specification (Vendor)
   * Adds a new specification key-value pair to a product owned by the vendor.
   */
  @ApiVendorCreateSpecification()
  @Post('/:productId/specifications')
  async createSpecification(
    @GetCurrentUser() user: CurrentUserContext,
    @Param('productId') productId: string,
    @Body() createProductSpecificationDto: CreateProductSpecificationDto,
  ) {
    return this.productService.createSpecification(
      productId,
      createProductSpecificationDto,
      user.id,
    );
  }

  /**
   * ------ GET - Fetch specifications by product ID (Vendor)
   * Retrieves all specifications for a product owned by the vendor.
   */
  @ApiVendorGetSpecifications()
  @Get('/:productId/specifications')
  async getSpecifications(
    @GetCurrentUser() user: CurrentUserContext,
    @Param('productId') productId: string,
  ) {
    return this.productService.getSpecificationsByProductId(productId, user.id);
  }

  /**
   * ------ GET - Fetch specification by ID (Vendor)
   * Retrieves detailed specification information for a specific specification owned by the vendor.
   */
  @ApiVendorGetSpecificationById()
  @Get('specifications/:specId')
  async getSpecificationById(
    @GetCurrentUser() user: CurrentUserContext,
    @Param('specId') specId: string,
  ) {
    return this.productService.getSpecificationById(specId, user.id);
  }

  /**
   * ------ PUT - Update specification (Vendor)
   * Updates key, value, and sort order on a specification owned by the vendor.
   */
  @ApiVendorUpdateSpecification()
  @Put('specifications/:specId')
  async updateSpecification(
    @GetCurrentUser() user: CurrentUserContext,
    @Param('specId') specId: string,
    @Body() updateProductSpecificationDto: UpdateProductSpecificationDto,
  ) {
    return this.productService.updateSpecification(
      specId,
      updateProductSpecificationDto,
      user.id,
    );
  }

  /**
   * ------ DELETE - Delete specification (Vendor)
   * Removes a specification owned by the vendor.
   */
  @ApiVendorDeleteSpecification()
  @Delete('specifications/:specId')
  async deleteSpecification(
    @GetCurrentUser() user: CurrentUserContext,
    @Param('specId') specId: string,
  ) {
    return this.productService.deleteSpecification(specId, user.id);
  }
}

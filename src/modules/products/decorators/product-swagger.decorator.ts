import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CreateProductDto } from '../dto/vendor/create-product.dto';
import { UpdateProductDto } from '../dto/vendor/update-product.dto';
import { CreateProductVariantDto } from '../dto/vendor/create-product-variant.dto';
import { UpdateProductVariantDto } from '../dto/vendor/update-product-variant.dto';
import { CreateProductSpecificationDto } from '../dto/vendor/create-product-specification.dto';
import { UpdateProductSpecificationDto } from '../dto/vendor/update-product-specification.dto';
import { UpdateProductStatusDto } from '../dto/admin/update-product-status.dto';
import { AdminUpdateProductDto } from '../dto/admin/admin-update-product.dto';
import { ProductStatusEnum } from 'src/common/enums/product-status.enum';

// ───────────────────────────── VENDOR PRODUCT ─────────────────────────────

/**
 * Swagger documentation decorator for vendor product creation.
 */
export function ApiVendorCreateProduct() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Create a new product — always sets DRAFT status (Vendor only)',
    }),
    ApiBody({ type: CreateProductDto }),
    ApiResponse({ status: 201, description: 'Product created successfully.' }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({
      status: 409,
      description: 'Product with this slug already exists.',
    }),
  );
}

/**
 * Swagger documentation decorator for vendor product update.
 */
export function ApiVendorUpdateProduct() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary:
        'Edit own product name, description, slug — never status (Vendor only)',
    }),
    ApiBody({ type: UpdateProductDto }),
    ApiResponse({ status: 200, description: 'Product updated successfully.' }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({
      status: 404,
      description: 'Product not found or not owned by this vendor.',
    }),
    ApiResponse({
      status: 409,
      description: 'Product with this slug already exists.',
    }),
  );
}

/**
 * Swagger documentation decorator for vendor product deletion.
 */
export function ApiVendorDeleteProduct() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Delete own DRAFT product only (Vendor only)' }),
    ApiResponse({ status: 200, description: 'Product deleted successfully.' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({
      status: 403,
      description: 'Only DRAFT products can be deleted by vendors.',
    }),
    ApiResponse({
      status: 404,
      description: 'Product not found or not owned by this vendor.',
    }),
  );
}

/**
 * Swagger documentation decorator for vendor getting all of their own products.
 */
export function ApiVendorGetAllProducts() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary:
        'Get all owned products with pagination and filters (Vendor only)',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number for pagination',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of items per page',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search query matching product name or description',
    }),
    ApiQuery({
      name: 'categoryId',
      required: false,
      type: String,
      description: 'Filter products by category ID',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ProductStatusEnum,
      description: 'Filter products by status',
    }),
    ApiResponse({
      status: 200,
      description: 'Products retrieved successfully.',
    }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
  );
}

/**
 * Swagger documentation decorator for vendor getting their own product by ID.
 */
export function ApiVendorGetProductById() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary:
        'Get detailed information of a specific owned product by ID (Vendor only)',
    }),
    ApiParam({
      name: 'id',
      type: String,
      description: 'The unique identifier of the product',
    }),
    ApiResponse({
      status: 200,
      description: 'Product retrieved successfully.',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({
      status: 404,
      description: 'Product not found.',
    }),
  );
}

// ───────────────────────────── VENDOR VARIANT ─────────────────────────────

/**
 * Swagger documentation decorator for adding a variant to a product.
 */
export function ApiVendorCreateVariant() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary:
        'Add a variant with price and attributes to a product (Vendor only)',
    }),
    ApiBody({ type: CreateProductVariantDto }),
    ApiResponse({ status: 201, description: 'Variant created successfully.' }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({
      status: 404,
      description: 'Product not found or not owned by this vendor.',
    }),
  );
}

/**
 * Swagger documentation decorator for updating a variant.
 */
export function ApiVendorUpdateVariant() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update variant price, stock, and attributes (Vendor only)',
    }),
    ApiBody({ type: UpdateProductVariantDto }),
    ApiResponse({ status: 200, description: 'Variant updated successfully.' }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({
      status: 404,
      description: 'Variant not found or not owned by this vendor.',
    }),
  );
}

/**
 * Swagger documentation decorator for removing a variant.
 */
export function ApiVendorDeleteVariant() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary:
        'Remove a variant — at least one variant must remain (Vendor only)',
    }),
    ApiResponse({ status: 200, description: 'Variant deleted successfully.' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({
      status: 404,
      description: 'Variant not found or not owned by this vendor.',
    }),
    ApiResponse({
      status: 409,
      description: 'Cannot delete the last remaining variant.',
    }),
  );
}

// ───────────────────────────── ADMIN PRODUCT ─────────────────────────────

/**
 * Swagger documentation decorator for admin product status update.
 */
export function ApiAdminUpdateProductStatus() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Publish, reject (+note), or archive a product (Admin only)',
    }),
    ApiBody({ type: UpdateProductStatusDto }),
    ApiResponse({
      status: 200,
      description: 'Product status updated successfully.',
    }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({ status: 404, description: 'Product not found.' }),
  );
}

/**
 * Swagger documentation decorator for admin force-editing any product field.
 */
export function ApiAdminUpdateProduct() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Force-edit any field on any product (Admin only)',
    }),
    ApiBody({ type: AdminUpdateProductDto }),
    ApiResponse({ status: 200, description: 'Product updated successfully.' }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({ status: 404, description: 'Product not found.' }),
    ApiResponse({
      status: 409,
      description: 'Product with this slug already exists.',
    }),
  );
}

/**
 * Swagger documentation decorator for admin hard-deleting a product.
 */
export function ApiAdminDeleteProduct() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Hard delete any product (Admin only)' }),
    ApiResponse({ status: 200, description: 'Product deleted successfully.' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({ status: 404, description: 'Product not found.' }),
  );
}

/**
 * Swagger documentation decorator for admin fetching all products.
 */
export function ApiAdminGetAllProducts() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get all products with pagination and filters (Admin only)',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number for pagination',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of items per page',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description:
        'Search query for matching product name or vendor business name',
    }),
    ApiQuery({
      name: 'categoryId',
      required: false,
      type: String,
      description: 'Filter products by category ID',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ProductStatusEnum,
      description: 'Filter products by status',
    }),
    ApiResponse({
      status: 200,
      description: 'Products retrieved successfully.',
    }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden. Admin role required.',
    }),
  );
}

/**
 * Swagger documentation decorator for admin fetching a product by ID.
 */
export function ApiAdminGetProductById() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary:
        'Get detailed information of a specific product by its ID (Admin only)',
    }),
    ApiParam({
      name: 'id',
      type: String,
      description: 'The unique identifier of the product',
    }),
    ApiResponse({
      status: 200,
      description: 'Product retrieved successfully.',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden. Admin role required.',
    }),
    ApiResponse({ status: 404, description: 'Product not found.' }),
  );
}

// ───────────────────────────── VENDOR PRODUCT SPECIFICATION ─────────────────────────────

/**
 * Swagger documentation decorator for adding a specification to a product.
 */
export function ApiVendorCreateSpecification() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Add a specification key-value pair to a product (Vendor only)',
    }),
    ApiParam({
      name: 'productId',
      type: String,
      description: 'The unique identifier of the product',
    }),
    ApiBody({ type: CreateProductSpecificationDto }),
    ApiResponse({
      status: 201,
      description: 'Specification created successfully.',
    }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({
      status: 404,
      description: 'Product not found or not owned by this vendor.',
    }),
  );
}

/**
 * Swagger documentation decorator for fetching specifications of a product.
 */
export function ApiVendorGetSpecifications() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary:
        'Get all specifications for a specific owned product (Vendor only)',
    }),
    ApiParam({
      name: 'productId',
      type: String,
      description: 'The unique identifier of the product',
    }),
    ApiResponse({
      status: 200,
      description: 'Specifications retrieved successfully.',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({
      status: 404,
      description: 'Product not found or not owned by this vendor.',
    }),
  );
}

/**
 * Swagger documentation decorator for getting a specification by ID.
 */
export function ApiVendorGetSpecificationById() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get a single owned specification by ID (Vendor only)',
    }),
    ApiParam({
      name: 'specId',
      type: String,
      description: 'The unique identifier of the specification',
    }),
    ApiResponse({
      status: 200,
      description: 'Specification retrieved successfully.',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({
      status: 404,
      description: 'Specification not found.',
    }),
  );
}

/**
 * Swagger documentation decorator for updating a specification.
 */
export function ApiVendorUpdateSpecification() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary:
        'Update an owned specification key, value, or sort order (Vendor only)',
    }),
    ApiParam({
      name: 'specId',
      type: String,
      description: 'The unique identifier of the specification',
    }),
    ApiBody({ type: UpdateProductSpecificationDto }),
    ApiResponse({
      status: 200,
      description: 'Specification updated successfully.',
    }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({
      status: 404,
      description: 'Specification not found or not owned by this vendor.',
    }),
  );
}

/**
 * Swagger documentation decorator for deleting a specification.
 */
export function ApiVendorDeleteSpecification() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Delete an owned specification (Vendor only)',
    }),
    ApiParam({
      name: 'specId',
      type: String,
      description: 'The unique identifier of the specification',
    }),
    ApiResponse({
      status: 200,
      description: 'Specification deleted successfully.',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({
      status: 404,
      description: 'Specification not found or not owned by this vendor.',
    }),
  );
}

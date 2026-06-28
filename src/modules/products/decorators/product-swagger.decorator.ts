import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CreateProductDto } from '../dto/vendor/create-product.dto';
import { UpdateProductDto } from '../dto/vendor/update-product.dto';
import { CreateProductVariantDto } from '../dto/vendor/create-product-variant.dto';
import { UpdateProductVariantDto } from '../dto/vendor/update-product-variant.dto';
import { UpdateProductStatusDto } from '../dto/admin/update-product-status.dto';
import { AdminUpdateProductDto } from '../dto/admin/admin-update-product.dto';

// ───────────────────────────── VENDOR PRODUCT ─────────────────────────────

/**
 * Swagger documentation decorator for vendor product creation.
 */
export function ApiVendorCreateProduct() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Create a new product — always sets DRAFT status (Vendor only)' }),
    ApiBody({ type: CreateProductDto }),
    ApiResponse({ status: 201, description: 'Product created successfully.' }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT.' }),
    ApiResponse({ status: 409, description: 'Product with this slug already exists.' }),
  );
}

/**
 * Swagger documentation decorator for vendor product update.
 */
export function ApiVendorUpdateProduct() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Edit own product name, description, slug — never status (Vendor only)' }),
    ApiBody({ type: UpdateProductDto }),
    ApiResponse({ status: 200, description: 'Product updated successfully.' }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT.' }),
    ApiResponse({ status: 404, description: 'Product not found or not owned by this vendor.' }),
    ApiResponse({ status: 409, description: 'Product with this slug already exists.' }),
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
    ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT.' }),
    ApiResponse({ status: 403, description: 'Only DRAFT products can be deleted by vendors.' }),
    ApiResponse({ status: 404, description: 'Product not found or not owned by this vendor.' }),
  );
}

// ───────────────────────────── VENDOR VARIANT ─────────────────────────────

/**
 * Swagger documentation decorator for adding a variant to a product.
 */
export function ApiVendorCreateVariant() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Add a variant with price and attributes to a product (Vendor only)' }),
    ApiBody({ type: CreateProductVariantDto }),
    ApiResponse({ status: 201, description: 'Variant created successfully.' }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT.' }),
    ApiResponse({ status: 404, description: 'Product not found or not owned by this vendor.' }),
  );
}

/**
 * Swagger documentation decorator for updating a variant.
 */
export function ApiVendorUpdateVariant() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Update variant price, stock, and attributes (Vendor only)' }),
    ApiBody({ type: UpdateProductVariantDto }),
    ApiResponse({ status: 200, description: 'Variant updated successfully.' }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT.' }),
    ApiResponse({ status: 404, description: 'Variant not found or not owned by this vendor.' }),
  );
}

/**
 * Swagger documentation decorator for removing a variant.
 */
export function ApiVendorDeleteVariant() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Remove a variant — at least one variant must remain (Vendor only)' }),
    ApiResponse({ status: 200, description: 'Variant deleted successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT.' }),
    ApiResponse({ status: 404, description: 'Variant not found or not owned by this vendor.' }),
    ApiResponse({ status: 409, description: 'Cannot delete the last remaining variant.' }),
  );
}

// ───────────────────────────── ADMIN PRODUCT ─────────────────────────────

/**
 * Swagger documentation decorator for admin product status update.
 */
export function ApiAdminUpdateProductStatus() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Publish, reject (+note), or archive a product (Admin only)' }),
    ApiBody({ type: UpdateProductStatusDto }),
    ApiResponse({ status: 200, description: 'Product status updated successfully.' }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT.' }),
    ApiResponse({ status: 404, description: 'Product not found.' }),
  );
}

/**
 * Swagger documentation decorator for admin force-editing any product field.
 */
export function ApiAdminUpdateProduct() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Force-edit any field on any product (Admin only)' }),
    ApiBody({ type: AdminUpdateProductDto }),
    ApiResponse({ status: 200, description: 'Product updated successfully.' }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT.' }),
    ApiResponse({ status: 404, description: 'Product not found.' }),
    ApiResponse({ status: 409, description: 'Product with this slug already exists.' }),
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
    ApiResponse({ status: 401, description: 'Unauthorized. Invalid or missing JWT.' }),
    ApiResponse({ status: 404, description: 'Product not found.' }),
  );
}

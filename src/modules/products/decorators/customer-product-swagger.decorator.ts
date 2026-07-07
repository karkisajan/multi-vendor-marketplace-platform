import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

/**
 * Swagger documentation decorator for fetching customer-facing product listings.
 */
export function ApiCustomerGetAllProducts() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get published products with search, cursor, and price filters',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Maximum number of products to return',
    }),
    ApiQuery({
      name: 'cursor',
      required: false,
      type: String,
      description: 'Cursor token for paginated product browsing',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description:
        'Search term matching product name, description, or category',
    }),
    ApiQuery({
      name: 'maxPrice',
      required: false,
      type: Number,
      description: 'Upper bound for product price filtering',
    }),
    ApiQuery({
      name: 'minPrice',
      required: false,
      type: Number,
      description: 'Lower bound for product price filtering',
    }),
    ApiResponse({
      status: 200,
      description: 'Products retrieved successfully.',
    }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
  );
}

/**
 * Swagger documentation decorator for fetching a published product by slug.
 */
export function ApiCustomerGetProductBySlug() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a published product by its slug',
    }),
    ApiParam({
      name: 'slug',
      type: String,
      description: 'SEO-friendly slug for the product',
    }),
    ApiResponse({
      status: 200,
      description: 'Product retrieved successfully.',
    }),
    ApiResponse({ status: 404, description: 'Product not found.' }),
  );
}

/**
 * Swagger documentation decorator for fetching similar products.
 */
export function ApiCustomerGetSimilarProducts() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get similar published products for a given product slug',
    }),
    ApiParam({
      name: 'slug',
      type: String,
      description: 'SEO-friendly slug for the product',
    }),
    ApiResponse({
      status: 200,
      description: 'Similar products retrieved successfully.',
    }),
    ApiResponse({ status: 404, description: 'Product not found.' }),
  );
}

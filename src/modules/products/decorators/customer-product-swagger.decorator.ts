import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateProductRatingDto } from '../dto/customer/create-product-rating.dto';
import { UpdateProductRatingDto } from '../dto/customer/update-product-rating.dto';

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

// ───────────────────────────── CUSTOMER RATING ─────────────────────────────

/**
 * Swagger documentation decorator for creating a product rating.
 */
export function ApiCustomerCreateRating() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary:
        'Submit a rating and optional review for a published product (Customer only)',
    }),
    ApiParam({
      name: 'productId',
      type: String,
      description: 'The unique identifier of the product to rate',
    }),
    ApiBody({ type: CreateProductRatingDto }),
    ApiResponse({ status: 201, description: 'Rating created successfully.' }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({ status: 404, description: 'Product not found.' }),
    ApiResponse({
      status: 409,
      description: 'You have already rated this product.',
    }),
  );
}

/**
 * Swagger documentation decorator for updating an own product rating.
 */
export function ApiCustomerUpdateRating() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update own rating score or comment (Customer only)',
    }),
    ApiParam({
      name: 'id',
      type: String,
      description: 'The unique identifier of the rating to update',
    }),
    ApiBody({ type: UpdateProductRatingDto }),
    ApiResponse({ status: 200, description: 'Rating updated successfully.' }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({
      status: 403,
      description: 'You can only update your own ratings.',
    }),
    ApiResponse({ status: 404, description: 'Rating not found.' }),
  );
}

/**
 * Swagger documentation decorator for deleting an own product rating.
 */
export function ApiCustomerDeleteRating() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Delete own product rating (Customer only)',
    }),
    ApiParam({
      name: 'id',
      type: String,
      description: 'The unique identifier of the rating to delete',
    }),
    ApiResponse({ status: 200, description: 'Rating deleted successfully.' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized. Invalid or missing JWT.',
    }),
    ApiResponse({
      status: 403,
      description: 'You can only delete your own ratings.',
    }),
    ApiResponse({ status: 404, description: 'Rating not found.' }),
  );
}

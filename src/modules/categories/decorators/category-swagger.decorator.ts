import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { StatusTypeEnum } from 'src/common/enums/status-type.enum';

/**
 * Swagger documentation decorator for category creation.
 */
export function ApiCreateCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new category (Admin only)' }),
    ApiBody({ type: CreateCategoryDto }),
    ApiResponse({ status: 201, description: 'Category created successfully.' }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({
      status: 409,
      description: 'Category with this name already exists.',
    }),
  );
}

/**
 * Swagger documentation decorator for category update.
 */
export function ApiUpdateCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an existing category by ID (Admin only)' }),
    ApiBody({ type: UpdateCategoryDto }),
    ApiResponse({ status: 200, description: 'Category updated successfully.' }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({ status: 404, description: 'Category not found.' }),
    ApiResponse({ status: 409, description: 'Category name already in use.' }),
  );
}

/**
 * Swagger documentation decorator for fetching categories in a flat list.
 */
export function ApiGetFlatCategories() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Get flat list of categories with pagination and optional filtering (Admin only)',
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
      name: 'status',
      required: false,
      enum: StatusTypeEnum,
      description: 'Filter by publication status',
    }),
    ApiQuery({
      name: 'isActive',
      required: false,
      type: Boolean,
      description: 'Filter by active/inactive status',
    }),
    ApiQuery({
      name: 'query',
      required: false,
      type: String,
      description: 'Search query for matching category name',
    }),
    ApiResponse({
      status: 200,
      description: 'Successfully retrieved flat category list.',
    }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
  );
}

/**
 * Swagger documentation decorator for fetching the hierarchical category tree.
 */
export function ApiGetCategoryTree() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Get categories represented as a hierarchical tree up to 3 levels deep',
    }),
    ApiResponse({
      status: 200,
      description: 'Successfully retrieved hierarchical category tree.',
    }),
  );
}

/**
 * Swagger documentation decorator for fetching top-level parent categories.
 */
export function ApiGetAllParentCategories() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get list of top-level parent categories with pagination',
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
    ApiResponse({
      status: 200,
      description: 'Successfully retrieved parent categories.',
    }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
  );
}

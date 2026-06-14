import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';

/**
 * Swagger documentation decorator for category creation.
 */
export function ApiCreateCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new category (Admin only)' }),
    ApiBody({ type: CreateCategoryDto }),
    ApiResponse({ status: 201, description: 'Category created successfully.' }),
    ApiResponse({ status: 400, description: 'Validation failed.' }),
    ApiResponse({ status: 409, description: 'Category with this name already exists.' }),
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

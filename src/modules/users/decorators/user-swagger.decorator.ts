import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UpdateCustomerDto } from '../dto/user/update-customer.dto';

/**
 * Swagger decorator for GET /users/user-details
 *
 * Documents the endpoint that returns the authenticated user's
 * role-aware profile (customer or vendor fields).
 */
export function ApiGetUserDetails() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get current user profile',
      description:
        "Returns the authenticated user's profile details. " +
        "The response shape adapts based on the user's role (customer vs vendor).",
    }),
    ApiResponse({
      status: 200,
      description: 'User profile retrieved successfully.',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized — missing or invalid access token.',
    }),
  );
}

/**
 * Swagger decorator for PATCH /users/user-details
 *
 * Documents the partial-update endpoint. Customers and vendors
 * submit different field sets; the example body shows the customer shape.
 */
export function ApiUpdateUserProfile() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update current user profile',
      description:
        "Partially updates the authenticated user's profile. " +
        'Customers update firstName, lastName, profileUrl, phoneNumber. ' +
        'Vendors update businessName, businessProfileUrl, phoneNumber.',
    }),
    ApiBody({ type: UpdateCustomerDto }),
    ApiResponse({
      status: 200,
      description:
        'User profile updated successfully. Returns the refreshed profile.',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request — validation error in the request body.',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized — missing or invalid access token.',
    }),
    ApiResponse({
      status: 404,
      description: 'User not found — the account may have been deleted.',
    }),
  );
}

/**
 * Swagger decorator for DELETE /users/user-details
 *
 * Documents the soft-delete endpoint. The user's record is
 * preserved with a `deletedAt` timestamp for audit purposes.
 */
export function ApiDeleteUser() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Delete current user account',
      description:
        "Soft-deletes the authenticated user's account. " +
        'The record is preserved with a deletedAt timestamp for audit and potential recovery.',
    }),
    ApiResponse({
      status: 200,
      description: 'User account deleted successfully.',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized — missing or invalid access token.',
    }),
    ApiResponse({
      status: 404,
      description:
        'User not found — the account may have already been deleted.',
    }),
  );
}

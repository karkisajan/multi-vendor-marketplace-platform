import { Body, Controller, Delete, Get, Patch } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { CurrentUserContext } from '../types/user.types';
import { UpdateCustomerDto } from '../dto/user/update-customer.dto';
import { UpdateVendorDto } from '../dto/user/update.-vendor.dto';
import {
  ApiDeleteUser,
  ApiGetUserDetails,
  ApiUpdateUserProfile,
} from '../decorators/user-swagger.decorator';

/**
 * User Controller
 *
 * Handles authenticated user operations — fetching, updating,
 * and deleting the current user's account.  All endpoints use the
 * JWT-extracted `CurrentUserContext` to scope actions to the
 * caller, so no user ID parameter is required.
 */
@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * GET /users/user-details
   *
   * Returns the authenticated user's profile details.
   * The response shape adapts based on the user's role
   * (customer vs vendor).
   */
  @Get('/user-details')
  @ApiGetUserDetails()
  async getUserDetails(@GetCurrentUser() user: CurrentUserContext) {
    return await this.userService.getUserDetails(user);
  }

  /**
   * PATCH /users/user-details
   *
   * Partially updates the authenticated user's profile.
   * Customers submit `UpdateCustomerDto` fields (firstName, lastName, etc.)
   * while vendors submit `UpdateVendorDto` fields (businessName, etc.).
   * The role from the JWT payload determines which DTO validation
   * and profile table is used.
   */
  @Patch('/user-details')
  @ApiUpdateUserProfile()
  async updateUserProfile(
    @GetCurrentUser() user: CurrentUserContext,
    @Body() updateDto: UpdateCustomerDto | UpdateVendorDto,
  ) {
    return await this.userService.updateUserProfile(user, updateDto);
  }

  /**
   * DELETE /users/user-details
   *
   * Soft-deletes the authenticated user's account.
   * The user record is not physically removed — instead a `deletedAt`
   * timestamp is set, preserving order history and audit trails.
   */
  @Delete('/user-details')
  @ApiDeleteUser()
  async deleteUser(@GetCurrentUser() user: CurrentUserContext) {
    return await this.userService.deleteUser(user);
  }
}

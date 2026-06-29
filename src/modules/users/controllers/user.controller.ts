import { Body, Controller, Delete, Get, Patch } from '@nestjs/common';
import { UserService } from '../services/user.service';
import {
  ApiDeleteUser,
  ApiGetUserDetails,
  ApiUpdateUserProfile,
} from '../decorators/user-swagger.decorator';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { CurrentUserContext } from '../types/user.types';
import { UpdateCustomerDto } from '../dto/user/update-customer.dto';
import { UpdateVendorDto } from '../dto/user/update.-vendor.dto';

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
   */
  @Get('/user-details')
  @ApiGetUserDetails()
  async getUserDetails(@GetCurrentUser() user: CurrentUserContext) {
    console.log('This is the user data', user);
    return await this.userService.getUserDetails(user);
  }

  /**
   * PATCH /users/user-details
   *
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
   */
  @Delete('/user-details')
  @ApiDeleteUser()
  async deleteUser(@GetCurrentUser() user: CurrentUserContext) {
    return await this.userService.deleteUser(user);
  }
}

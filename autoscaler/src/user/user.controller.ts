import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Create single user
  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  // Bulk insert users
  @Post('bulk')
  async bulkInsert(@Query('count') count) {
    return this.userService.bulkInsert(Number(count));
  }

  // Get user by id
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.getUser(Number(id));
  }
}

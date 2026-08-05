import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserPreferencesController } from './user-preferences.controller';
import { UserPreferencesService } from './user-preferences.service';

@Module({
  controllers: [UserController, UserPreferencesController],
  providers: [UserService, UserPreferencesService],
  exports: [UserService, UserPreferencesService],
})
export class UserModule {}
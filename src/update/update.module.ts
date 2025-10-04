/**
 * Update Module for 4Paws Backend
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UpdateController } from './update.controller';

@Module({
  imports: [ConfigModule],
  controllers: [UpdateController],
  providers: [],
  exports: [],
})
export class UpdateModule {}


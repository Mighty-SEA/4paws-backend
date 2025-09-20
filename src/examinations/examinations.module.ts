import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MixModule } from '../mix/mix.module';
import { ExaminationsService } from './examinations.service';
import { ExaminationsController } from './examinations.controller';

@Module({
  imports: [PrismaModule, AuthModule, MixModule],
  providers: [ExaminationsService],
  controllers: [ExaminationsController],
})
export class ExaminationsModule {}



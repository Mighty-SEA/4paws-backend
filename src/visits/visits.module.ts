import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MixModule } from '../mix/mix.module';
import { VisitsService } from './visits.service';
import { VisitsController } from './visits.controller';

@Module({
  imports: [PrismaModule, AuthModule, MixModule],
  providers: [VisitsService],
  controllers: [VisitsController],
})
export class VisitsModule {}




import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VisitsService } from './visits.service';
import { VisitsController } from './visits.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [VisitsService],
  controllers: [VisitsController],
})
export class VisitsModule {}




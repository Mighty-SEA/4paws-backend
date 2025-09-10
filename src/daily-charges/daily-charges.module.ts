import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DailyChargesService } from './daily-charges.service';
import { DailyChargesController } from './daily-charges.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [DailyChargesService],
  controllers: [DailyChargesController],
})
export class DailyChargesModule {}



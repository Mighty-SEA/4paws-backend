import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DepositsService } from './deposits.service';
import { DepositsController } from './deposits.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [DepositsService],
  controllers: [DepositsController],
})
export class DepositsModule {}



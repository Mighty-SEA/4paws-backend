import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [ExpensesService],
  controllers: [ExpensesController],
})
export class ExpensesModule {}



import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OwnersModule } from './owners/owners.module';
import { CatalogModule } from './services/catalog.module';
import { BookingsModule } from './bookings/bookings.module';
import { ExaminationsModule } from './examinations/examinations.module';
import { ProductsModule } from './products/products.module';
import { VisitsModule } from './visits/visits.module';
import { DailyChargesModule } from './daily-charges/daily-charges.module';
import { BillingModule } from './billing/billing.module';
import { DepositsModule } from './deposits/deposits.module';
import { MixModule } from './mix/mix.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { StaffModule } from './staff/staff.module';
import { UsersModule } from './users/users.module';
import { DraftsModule } from './drafts/drafts.module';
// import { ExpensesModule } from './expenses/expenses.module';
import { SettingsModule } from './settings/settings.module';
import { ExpensesModule } from './expenses/expenses.module';
import { UpdateModule } from './update/update.module';

@Module({
  imports: [PrismaModule, AuthModule, OwnersModule, CatalogModule, BookingsModule, ExaminationsModule, ProductsModule, VisitsModule, DepositsModule, DailyChargesModule, BillingModule, MixModule, PaymentsModule, ReportsModule, StaffModule, UsersModule, DraftsModule, SettingsModule, ExpensesModule, UpdateModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

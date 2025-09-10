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

@Module({
  imports: [PrismaModule, AuthModule, OwnersModule, CatalogModule, BookingsModule, ExaminationsModule, ProductsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MixService } from './mix.service';
import { MixController } from './mix.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [MixService],
  controllers: [MixController],
})
export class MixModule {}



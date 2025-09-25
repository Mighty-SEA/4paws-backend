import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('product-usage')
  async getProductUsage(
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('groupBy') groupBy: 'day' | 'product' | 'source' | 'service' = 'day',
    @Query('productId') productId?: string[] | string,
    @Query('sourceType') sourceType?: string[] | string,
  ) {
    const productIds = Array.isArray(productId)
      ? productId.map((v) => Number(v))
      : productId
        ? String(productId)
            .split(',')
            .map((v) => Number(v.trim()))
            .filter((n) => !Number.isNaN(n))
        : [];
    const sourceTypes = Array.isArray(sourceType)
      ? sourceType
      : sourceType
        ? String(sourceType)
            .split(',')
            .map((v) => v.trim())
        : [];
    return this.reportsService.productUsage({
      start,
      end,
      groupBy,
      productIds,
      sourceTypes,
    });
  }

  @Get('handling')
  async getHandling(
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('staffId') staffId?: string,
    @Query('role') role?: 'DOCTOR' | 'PARAVET' | 'ADMIN' | 'GROOMER' | 'ALL',
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sort') sort?: 'asc' | 'desc',
  ) {
    return this.reportsService.handling({
      start,
      end,
      staffId: staffId ? Number(staffId) : undefined,
      role: role ?? 'ALL',
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      sort: sort ?? 'desc',
    });
  }

  @Get('revenue')
  async getRevenue(@Query('start') start?: string, @Query('end') end?: string) {
    return this.reportsService.revenue({
      start,
      end,
    });
  }
}

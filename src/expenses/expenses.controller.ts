import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExpensesService } from './expenses.service';

@UseGuards(AuthGuard('jwt'))
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  list(
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('category') category?: string,
  ) {
    return this.expenses.list({ start, end, category });
  }

  @Post()
  create(@Body() dto: { expenseDate?: string; category: string; description?: string; amount: string }) {
    return this.expenses.create(dto);
  }
}



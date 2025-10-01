import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AllowRoles } from '../auth/roles.decorator';
import { ExpensesService } from './expenses.service';

@UseGuards(AuthGuard('jwt'))
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  list(@Query('start') start?: string, @Query('end') end?: string, @Query('q') q?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.expenses.list({ start, end, q, page: Number(page ?? 1), pageSize: Number(pageSize ?? 20) });
  }

  @AllowRoles('MASTER', 'SUPERVISOR', 'ADMIN')
  @Post()
  create(@Body() body: { expenseDate?: string; description?: string; amount: number }) {
    return this.expenses.create({ expenseDate: body.expenseDate, description: body.description, amount: Number(body.amount) });
  }

  @AllowRoles('MASTER', 'SUPERVISOR', 'ADMIN')
  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<{ expenseDate: string; description: string; amount: number }>) {
    return this.expenses.update(Number(id), body);
  }

  @AllowRoles('MASTER', 'SUPERVISOR', 'ADMIN')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.expenses.delete(Number(id));
  }
}



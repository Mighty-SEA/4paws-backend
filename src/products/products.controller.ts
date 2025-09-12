import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AddInventoryDto, CreateProductDto } from './dto';
import { ProductsService } from './products.service';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get('products')
  list() {
    return this.products.listProducts();
  }

  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.products.createProduct(dto);
  }

  @Post('inventory')
  addInventory(@Req() req: any, @Body() dto: AddInventoryDto) {
    const role: string = req.user?.role;
    return this.products.addInventory(role, dto);
  }

  @Get('inventory')
  listInventory(
    @Query('limit') limit?: string,
    @Query('types') typesCsv?: string,
    @Query('productId') productId?: string,
  ) {
    const types = typesCsv ? typesCsv.split(',').map((t) => t.trim()).filter(Boolean) : undefined;
    return this.products.listInventory({
      limit: limit ? Number(limit) : undefined,
      types: types as any,
      productId: productId ? Number(productId) : undefined,
    });
  }

  @Get('inventory/:productId/available')
  getAvailable(@Param('productId') productId: string) {
    return this.products.getAvailable(Number(productId));
  }
}



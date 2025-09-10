import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
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

  @Get('inventory/:productId/available')
  getAvailable(@Param('productId') productId: string) {
    return this.products.getAvailable(Number(productId));
  }
}



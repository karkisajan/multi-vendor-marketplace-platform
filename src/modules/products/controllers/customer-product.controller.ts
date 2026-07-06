import { Controller } from '@nestjs/common';
import { ProductService } from '../services/product.service';

@Controller('/customers/products')
export class CustomerProductController {
  constructor(private readonly productService: ProductService) {}
}

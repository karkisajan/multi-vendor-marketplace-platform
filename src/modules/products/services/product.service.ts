import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';
import { ProductVariantRepository } from '../repositories/product-variant.repository';
import { CreateProductDto } from '../dto/vendor/create-product.dto';
import { UpdateProductDto } from '../dto/vendor/update-product.dto';
import { CreateProductVariantDto } from '../dto/vendor/create-product-variant.dto';
import { UpdateProductVariantDto } from '../dto/vendor/update-product-variant.dto';
import { UpdateProductStatusDto } from '../dto/admin/update-product-status.dto';
import { AdminUpdateProductDto } from '../dto/admin/admin-update-product.dto';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { generateSlug } from 'src/common/utils/generate-slug.util';
import { CategoryRepository } from 'src/modules/categories/repositories/category.repository';
import { Category } from 'src/modules/categories/entities/category.entity';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productVariantRepository: ProductVariantRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  /* ------- Vendor sepcific services -------- */

  /**
   * ------ POST - Create product (Vendor)
   * Creates a new product for the authenticated vendor with DRAFT status.
   * Generates a unique slug from the product name and validates uniqueness before persisting.
   */
  async createProduct(createProductDto: CreateProductDto, vendorId: string) {
    const categoryExists: Category | null =
      await this.categoryRepository.findCategoryById(
        createProductDto.categoryId,
      );
    if (!categoryExists) {
      throw new NotFoundException('Category not found.');
    }

    const slug: string = generateSlug(createProductDto.name);

    const existingProduct: Product | null =
      await this.productRepository.findProductBySlug(slug);
    if (existingProduct) {
      throw new ConflictException('Product with this slug already exists.');
    }

    const savedProduct: Product = await this.productRepository.createProduct(
      createProductDto,
      vendorId,
      slug,
    );

    return {
      message: 'Product created successfully.',
      id: savedProduct.id,
      name: savedProduct.name,
      slug: savedProduct.slug,
      description: savedProduct.description,
      categoryId: savedProduct.categoryId,
      status: savedProduct.status,
    };
  }

  /**
   * ------ PUT - Update product (Vendor)
   * Updates an existing product owned by the vendor. Only name, description, and categoryId can be changed.
   * Regenerates the slug when the name changes and validates uniqueness.
   * Status is never modifiable through this endpoint — vendors cannot bypass admin review.
   */
  async updateProduct(
    productId: string,
    updateProductDto: UpdateProductDto,
    vendorId: string,
  ) {
    const product: Product | null =
      await this.productRepository.findProductByIdAndVendor(
        productId,
        vendorId,
      );
    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const updateData: Partial<Product> = {};
    if (
      updateProductDto.name !== undefined &&
      updateProductDto.name !== product.name
    ) {
      const slug: string = generateSlug(updateProductDto.name);
      const existingSlug: Product | null =
        await this.productRepository.findProductBySlug(slug);
      if (existingSlug && existingSlug.id !== productId) {
        throw new ConflictException('Product with this slug already exists.');
      }
      updateData.name = updateProductDto.name;
      updateData.slug = slug;
    }

    if (updateProductDto.description !== undefined) {
      updateData.description = updateProductDto.description;
    }

    if (updateProductDto.categoryId !== undefined) {
      updateData.categoryId = updateProductDto.categoryId;
    }

    const updatedProduct: Product | null =
      await this.productRepository.updateProduct(productId, updateData);
    if (!updatedProduct) {
      throw new NotFoundException('Product not found after update.');
    }

    return {
      message: 'Product updated successfully.',
      id: updatedProduct.id,
      name: updatedProduct.name,
      slug: updatedProduct.slug,
      description: updatedProduct.description,
      categoryId: updatedProduct.categoryId,
      status: updatedProduct.status,
    };
  }

  /**
   * ------ DELETE - Delete product (Vendor)
   * Deletes a product only if the vendor owns it and its status is DRAFT.
   * Published or archived products must be reverted to DRAFT before deletion.
   */
  async deleteProduct(productId: string, vendorId: string) {
    const product: Product | null =
      await this.productRepository.findProductByIdAndVendor(
        productId,
        vendorId,
      );
    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    await this.productRepository.delete(productId);
    return {
      id: productId,
      message: 'Product deleted successfully.',
    };
  }

  /**
   * ------ POST - Create variant (Vendor)
   * Adds a new variant with pricing and attributes to a product owned by the vendor.
   * If isDefault is true and another default variant exists, this new one will take precedence.
   */
  async createVariant(
    productId: string,
    createProductVariantDto: CreateProductVariantDto,
    vendorId: string,
  ) {
    const product: Product | null =
      await this.productRepository.findProductByIdAndVendor(
        productId,
        vendorId,
      );
    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const savedVariant: ProductVariant =
      await this.productVariantRepository.createVariant({
        productId: productId,
        selllingPrice: createProductVariantDto.sellingPrice,
        crossPrice: createProductVariantDto.crossPrice,
        costPrice: createProductVariantDto.costPrice,
        stockQuantity: createProductVariantDto.stockQuantity,
        variantAttributes: createProductVariantDto.variantAttributes,
        isDefault: createProductVariantDto.isDefault ?? false,
      });

    return {
      message: 'Variant created successfully.',
      id: savedVariant.id,
      productId: savedVariant.productId,
      sellingPrice: savedVariant.selllingPrice,
      crossPrice: savedVariant.crossPrice,
      costPrice: savedVariant.costPrice,
      stockQuantity: savedVariant.stockQuantity,
      variantAttributes: savedVariant.variantAttributes,
      isDefault: savedVariant.isDefault,
    };
  }

  /**
   * ------ PUT - Update variant (Vendor)
   * Updates price, stock, or attributes on a variant that belongs to a product owned by the vendor.
   * Verifies variant ownership through its parent product's vendorId.
   */
  async updateVariant(
    variantId: string,
    updateProductVariantDto: UpdateProductVariantDto,
    vendorId: string,
  ) {
    const variant: ProductVariant | null =
      await this.productVariantRepository.findVariantById(variantId);
    if (!variant || variant.product?.vendorId !== vendorId) {
      throw new NotFoundException('Variant not found..');
    }

    const updateData: Partial<ProductVariant> = {};
    if (updateProductVariantDto.sellingPrice !== undefined) {
      updateData.selllingPrice = updateProductVariantDto.sellingPrice;
    }
    if (updateProductVariantDto.crossPrice !== undefined) {
      updateData.crossPrice = updateProductVariantDto.crossPrice;
    }
    if (updateProductVariantDto.costPrice !== undefined) {
      updateData.costPrice = updateProductVariantDto.costPrice;
    }
    if (updateProductVariantDto.stockQuantity !== undefined) {
      updateData.stockQuantity = updateProductVariantDto.stockQuantity;
    }
    if (updateProductVariantDto.variantAttributes !== undefined) {
      updateData.variantAttributes = updateProductVariantDto.variantAttributes;
    }
    if (updateProductVariantDto.isDefault !== undefined) {
      updateData.isDefault = updateProductVariantDto.isDefault;
    }

    const updatedVariant: ProductVariant | null =
      await this.productVariantRepository.updateVariant(variantId, updateData);
    if (!updatedVariant) {
      throw new NotFoundException('Variant not found.');
    }

    return {
      message: 'Variant updated successfully.',
      id: updatedVariant.id,
      productId: updatedVariant.productId,
      sellingPrice: updatedVariant.selllingPrice,
      crossPrice: updatedVariant.crossPrice,
      costPrice: updatedVariant.costPrice,
      stockQuantity: updatedVariant.stockQuantity,
      variantAttributes: updatedVariant.variantAttributes,
      isDefault: updatedVariant.isDefault,
    };
  }

  /**
   * ------ DELETE - Delete variant (Vendor)
   * Removes a variant from a product, enforcing the business rule that at least one variant must remain.
   * Verifies variant ownership through its parent product's vendorId before deletion.
   */
  async deleteVariant(variantId: string, vendorId: string) {
    const variant: ProductVariant | null =
      await this.productVariantRepository.findVariantById(variantId);
    if (!variant || variant.product?.vendorId !== vendorId) {
      throw new NotFoundException('Variant not found.');
    }

    /* Ensure at least one variant remains on the product after deletion */
    const variantCount: number =
      await this.productVariantRepository.countVariantsByProductId(
        variant.productId,
      );
    if (variantCount <= 1) {
      throw new ConflictException(
        'Cannot delete the last remaining variant. A product must have at least one variant.',
      );
    }

    await this.productVariantRepository.delete(variantId);

    return {
      id: variantId,
      message: 'Variant deleted successfully.',
    };
  }

  /* ------ Admin specific services */
  /**
   * ------ PUT - Update product status (Admin)
   * Transitions a product through lifecycle states: publish, reject, or archive.
   * Accepts an optional reviewNote for admin feedback visible to the vendor.
   */
  async adminUpdateProductStatus(
    productId: string,
    updateProductStatusDto: UpdateProductStatusDto,
  ) {
    const product: Product | null =
      await this.productRepository.findProductById(productId);
    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const updatedProduct: Product | null =
      await this.productRepository.updateProduct(productId, {
        status: updateProductStatusDto.status,
      });
    if (!updatedProduct) {
      throw new NotFoundException('Product not found after update.');
    }

    return {
      message: 'Product status updated successfully.',
      id: updatedProduct.id,
      name: updatedProduct.name,
      status: updatedProduct.status,
      reviewNote: updateProductStatusDto.reviewNote ?? null,
    };
  }

  /**
   * ------ PUT - Force-edit product (Admin)
   * Allows admin to update any product field including name, description, slug, categoryId, and status.
   * If name changes without an explicit slug, regenerates the slug and checks for conflicts.
   * If a slug is explicitly provided, it is used directly after conflict validation.
   */
  async adminUpdateProduct(
    productId: string,
    adminUpdateProductDto: AdminUpdateProductDto,
  ) {
    const product: Product | null =
      await this.productRepository.findProductById(productId);
    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    const updateData: Partial<Product> = {};
    if (adminUpdateProductDto.name !== undefined) {
      updateData.name = adminUpdateProductDto.name;
      if (adminUpdateProductDto.slug === undefined) {
        const slug: string = generateSlug(adminUpdateProductDto.name);
        const existingSlug: Product | null =
          await this.productRepository.findProductBySlug(slug);
        if (existingSlug && existingSlug.id !== productId) {
          throw new ConflictException('Product with this slug already exists.');
        }
        updateData.slug = slug;
      }
    }

    if (adminUpdateProductDto.slug !== undefined) {
      const existingSlug: Product | null =
        await this.productRepository.findProductBySlug(
          adminUpdateProductDto.slug,
        );
      if (existingSlug && existingSlug.id !== productId) {
        throw new ConflictException('Product with this slug already exists.');
      }
      updateData.slug = adminUpdateProductDto.slug;
    }

    if (adminUpdateProductDto.description !== undefined) {
      updateData.description = adminUpdateProductDto.description;
    }

    if (adminUpdateProductDto.categoryId !== undefined) {
      updateData.categoryId = adminUpdateProductDto.categoryId;
    }

    if (adminUpdateProductDto.status !== undefined) {
      updateData.status = adminUpdateProductDto.status;
    }

    const updatedProduct: Product | null =
      await this.productRepository.updateProduct(productId, updateData);
    if (!updatedProduct) {
      throw new NotFoundException('Product not found after update.');
    }

    return {
      message: 'Product updated successfully.',
      id: updatedProduct.id,
      name: updatedProduct.name,
      slug: updatedProduct.slug,
      description: updatedProduct.description,
      categoryId: updatedProduct.categoryId,
      status: updatedProduct.status,
    };
  }

  /**
   * ------ DELETE - Hard delete product (Admin)
   * Permanently removes a product and all its associated variants from the database.
   * Unlike vendor deletion, admin deletion works on any product regardless of status.
   */
  async adminDeleteProduct(productId: string) {
    const product: Product | null =
      await this.productRepository.findProductById(productId);
    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    await this.productRepository.delete(productId);

    return {
      id: productId,
      message: 'Product deleted successfully.',
    };
  }
}

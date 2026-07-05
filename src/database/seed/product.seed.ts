import dataSource from '../data-source';
import { User } from 'src/modules/users/entities/user.entity';
import { Category } from 'src/modules/categories/entities/category.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { ProductVariant } from 'src/modules/products/entities/product-variant.entity';
import { ProductImage } from 'src/modules/products/entities/product-image.entity';
import { UserRoleEnum } from 'src/common/enums/user-role.enum';
import { ProductStatusEnum } from 'src/common/enums/product-status.enum';
import { generateSlug } from 'src/common/utils/generate-slug.util';

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a',
  'https://images.unsplash.com/photo-1527814050087-3795213d246d',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90',
  'https://images.unsplash.com/photo-1581605405669-fcdf81165afa',
  'https://images.unsplash.com/photo-1503602642458-232111445657',
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d',
  'https://images.unsplash.com/photo-1508747703725-719777637510',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f',
  'https://images.unsplash.com/photo-1484704849700-f032a568e944',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad',
  'https://images.unsplash.com/photo-1586495777744-4413f21062fa',
  'https://images.unsplash.com/photo-1511556532299-8f662fc26c06',
  'https://images.unsplash.com/photo-1549298916-b41d501d3772',
  'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5',
  'https://images.unsplash.com/photo-1544816155-12df9643f363',
  'https://images.unsplash.com/photo-1512909006721-3d6018887383',
  'https://images.unsplash.com/photo-1546868871-7041f2a55e12',
  'https://images.unsplash.com/photo-1584006682522-dc17d6c0d9ec',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9',
  'https://images.unsplash.com/photo-1479064555552-3ef4979f8908',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
  'https://images.unsplash.com/photo-1531403009284-440f080d1e12',
  'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9',
  'https://images.unsplash.com/photo-1593642632823-8f785ba67e45',
  'https://images.unsplash.com/photo-1580870013141-3b13c9103890',
];

const ADJECTIVES = [
  'Premium',
  'Wireless',
  'Eco-friendly',
  'Ergonomic',
  'Smart',
  'Classic',
  'Modern',
  'Portable',
  'Heavy-duty',
  'Sleek',
  'Deluxe',
  'Compact',
  'Ultra-slim',
  'Waterproof',
  'Luxury',
];

const PRODUCT_CORES = [
  'Headphones',
  'Water Bottle',
  'Backpack',
  'Desk Lamp',
  'Keyboard',
  'Fitness Tracker',
  'Coffee Mug',
  'Leather Wallet',
  'Sunglasses',
  'Yoga Mat',
  'Blender',
  'Speaker',
  'Phone Stand',
  'Notebook',
  'Charger',
];

const COLORS = ['Red', 'Blue', 'Black', 'Green', 'White', 'Silver', 'Gold'];
const SIZES = ['S', 'M', 'L', 'XL'];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedProducts(): Promise<void> {
  await dataSource.initialize();
  const manager = dataSource.manager;

  console.log('Fetching vendors and categories from database...');
  const vendors = await manager.find(User, {
    where: { role: UserRoleEnum.VENDOR },
  });

  if (vendors.length === 0) {
    console.warn('No vendors found. Please run the user seed script first!');
    return;
  }

  const categories = await manager.find(Category);
  if (categories.length === 0) {
    console.warn(
      'No categories found. Please run the category seed script first!',
    );
    return;
  }

  console.log(
    `Found ${vendors.length} vendors and ${categories.length} categories.`,
  );

  for (let v = 0; v < vendors.length; v++) {
    const vendor = vendors[v];
    const productCount = getRandomNumber(150, 200);
    console.log(
      `Generating ${productCount} products for vendor: ${vendor.email} (${v + 1}/${vendors.length})...`,
    );

    const products: Product[] = [];

    for (let p = 0; p < productCount; p++) {
      const adjective = getRandomElement(ADJECTIVES);
      const core = getRandomElement(PRODUCT_CORES);
      const productName = `${adjective} ${core} - Batch ${v + 1} #${p + 1}`;
      const slug = generateSlug(
        `${productName}-${vendor.id.substring(0, 8)}-${p}`,
      );

      const product = new Product();
      product.vendorId = vendor.id;
      product.categoryId = getRandomElement(categories).id;
      product.name = productName;
      product.slug = slug;
      product.description = `Experience the best quality with our ${adjective.toLowerCase()} ${core.toLowerCase()}. Built with premium materials for maximum durability and satisfaction.`;
      product.status =
        Math.random() > 0.15
          ? ProductStatusEnum.PUBLISHED
          : ProductStatusEnum.DRAFT;

      const variants: ProductVariant[] = [];
      const numVariants = getRandomNumber(3, 5); // At least 3 variants
      const defaultVariantIndex = getRandomNumber(0, numVariants - 1);

      // Create variants
      for (let varIdx = 0; varIdx < numVariants; varIdx++) {
        const variant = new ProductVariant();
        const basePrice = getRandomNumber(15, 300);
        variant.sellingPrice = basePrice;
        variant.crossPrice = Number((basePrice * 1.25).toFixed(2));
        variant.costPrice = Number((basePrice * 0.6).toFixed(2));
        variant.stockQuantity = getRandomNumber(10, 200);
        variant.isDefault = varIdx === defaultVariantIndex;

        // Attributes
        const color = getRandomElement(COLORS);
        const size = getRandomElement(SIZES);
        variant.variantAttributes = { color, size };

        // Images for each variant
        const images: ProductImage[] = [];
        const numImages = getRandomNumber(3, 5); // At least 3 images
        const primaryImageIndex = getRandomNumber(0, numImages - 1);

        for (let imgIdx = 0; imgIdx < numImages; imgIdx++) {
          const img = new ProductImage();
          const sampleUrl = getRandomElement(SAMPLE_IMAGES);
          img.imageUrl = `${sampleUrl}?random=${v}-${p}-${varIdx}-${imgIdx}`;
          img.publicId = `vendor_${v}_prod_${p}_var_${varIdx}_img_${imgIdx}`;
          img.isPrimary = imgIdx === primaryImageIndex;
          images.push(img);
        }

        variant.productImages = images;
        variants.push(variant);
      }

      product.productVariants = variants;
      products.push(product);
    }

    // Save in chunks of 50 to avoid memory/transaction issues
    const chunkSize = 50;
    for (let i = 0; i < products.length; i += chunkSize) {
      const chunk = products.slice(i, i + chunkSize);
      await manager.save(Product, chunk);
    }

    console.log(`Successfully seeded products for vendor: ${vendor.email}`);
  }

  console.log('Seeding products, variants, and images completed successfully!');
}

seedProducts()
  .catch((error) => {
    console.error('Product seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(0);
  });

import dataSource from '../data-source';
import { User } from 'src/modules/users/entities/user.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { ProductRating } from 'src/modules/products/entities/product-rating.entity';
import { UserRoleEnum } from 'src/common/enums/user-role.enum';
import { ProductStatusEnum } from 'src/common/enums/product-status.enum';

const SAMPLE_COMMENTS = [
  'Excellent quality, exceeded my expectations!',
  'Good value for the price. Would recommend.',
  'Decent product but packaging could be better.',
  'Exactly as described. Very happy with my purchase.',
  'Fast shipping and great build quality.',
  'Average product, nothing special.',
  'Love it! Already ordered another one for a friend.',
  'Works well but the color was slightly different from the photo.',
  'Fantastic! Five stars without hesitation.',
  'Not bad, but I expected it to be a bit sturdier.',
  'Perfect gift idea. Looks premium.',
  'Solid product. Will buy from this vendor again.',
  'A bit overpriced for what you get, but still decent.',
  'Arrived on time and in perfect condition.',
  'Very practical and well-designed. Highly recommended.',
  null,
  null,
  null,
  null,
  null,
];

/** Returns a random integer between min (inclusive) and max (inclusive) */
function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Returns a random element from the array */
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffles an array in-place using the Fisher-Yates algorithm
 * and returns the first `count` elements.
 */
function pickRandom<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function seedRatings(): Promise<void> {
  await dataSource.initialize();
  const manager = dataSource.manager;

  console.log('Fetching customers and published products from database...');

  const customers = await manager.find(User, {
    where: { role: UserRoleEnum.CUSTOMER },
  });

  if (customers.length === 0) {
    console.warn('No customers found. Please run the user seed script first!');
    return;
  }

  const products = await manager.find(Product, {
    where: { status: ProductStatusEnum.PUBLISHED },
  });

  if (products.length === 0) {
    console.warn(
      'No published products found. Please run the product seed script first!',
    );
    return;
  }

  console.log(
    `Found ${customers.length} customers and ${products.length} published products.`,
  );

  const ratings: ProductRating[] = [];
  let skippedDuplicates = 0;

  /* Track existing customer-product pairs to avoid duplicates within this seed run */
  const ratedPairs = new Set<string>();

  for (const product of products) {
    const numRatings = getRandomNumber(3, 8);
    const selectedCustomers = pickRandom(customers, numRatings);

    for (const customer of selectedCustomers) {
      const pairKey = `${customer.id}:${product.id}`;
      if (ratedPairs.has(pairKey)) {
        skippedDuplicates++;
        continue;
      }
      ratedPairs.add(pairKey);

      const rating = new ProductRating();
      rating.productId = product.id;
      rating.customerId = customer.id;
      rating.score = getRandomNumber(1, 5);
      const selectedComment = getRandomElement(SAMPLE_COMMENTS);
      if (selectedComment) {
        rating.comment = selectedComment;
      }
      ratings.push(rating);
    }
  }

  console.log(
    `Generated ${ratings.length} ratings (${skippedDuplicates} duplicates skipped). Saving in chunks...`,
  );

  /* Save in chunks of 100 to avoid memory/transaction issues */
  const chunkSize = 100;
  for (let i = 0; i < ratings.length; i += chunkSize) {
    const chunk = ratings.slice(i, i + chunkSize);
    await manager.save(ProductRating, chunk);
  }

  console.log('Seeding product ratings completed successfully!');
}

seedRatings()
  .catch((error) => {
    console.error('Rating seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(0);
  });

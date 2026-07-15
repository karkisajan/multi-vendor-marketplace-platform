import dataSource from '../data-source';
import { Category } from 'src/modules/categories/entities/category.entity';
import { StatusTypeEnum } from 'src/common/enums/status-type.enum';
import { generateSlug } from 'src/common/utils/generate-slug.util';
import { EntityManager } from 'typeorm';

interface CategoryNode {
  name: string;
  shortDescription: string;
  longDescription?: string;
  imageUrl?: string;
  children?: CategoryNode[];
}

const CATEGORIES_DATA: CategoryNode[] = [
  {
    name: 'Electronics',
    shortDescription:
      'Gadgets, smart devices, computers, and electronic accessories',
    imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661',
    children: [
      {
        name: 'Laptops & Computers',
        shortDescription:
          'Computers, notebooks, and essential computing devices',
        children: [
          {
            name: 'Gaming Laptops',
            shortDescription: 'High-performance gaming machines',
          },
          {
            name: 'Accessories & Keyboards',
            shortDescription: 'Mice, keyboards, and input accessories',
          },
        ],
      },
      {
        name: 'Smart Phones & Tablets',
        shortDescription: 'Mobile devices, phones, and touch tablets',
        children: [
          {
            name: 'Android Devices',
            shortDescription: 'Smartphones and tablets running Android',
          },
          { name: 'iOS Devices', shortDescription: 'iPhones and iPads' },
        ],
      },
    ],
  },
  {
    name: 'Fashion & Apparel',
    shortDescription:
      'Clothing, footwear, and accessories for men, women, and kids',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b',
    children: [
      {
        name: "Men's Clothing",
        shortDescription: 'Menswear, shirts, trousers, and outerwear',
        children: [
          {
            name: 'Shirts & T-Shirts',
            shortDescription: 'Casual and formal tops for men',
          },
          {
            name: 'Pants & Jeans',
            shortDescription: 'Denim and formal trousers for men',
          },
        ],
      },
      {
        name: "Women's Clothing",
        shortDescription: 'Womenswear, dresses, tops, and skirts',
        children: [
          { name: 'Dresses', shortDescription: 'One-piece dresses and gowns' },
          {
            name: 'Tops & Blouses',
            shortDescription: 'Fashionable tops for women',
          },
        ],
      },
    ],
  },
  {
    name: 'Home & Living',
    shortDescription:
      'Home decor, kitchenware, furniture, and living essentials',
    imageUrl: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a',
    children: [
      {
        name: 'Kitchen & Dining',
        shortDescription: 'Cookware, tableware, and small appliances',
        children: [
          {
            name: 'Cookware',
            shortDescription: 'Pots, pans, and baking dishes',
          },
          {
            name: 'Coffee Makers',
            shortDescription: 'Espresso and filter coffee brewing devices',
          },
        ],
      },
      {
        name: 'Home Decor',
        shortDescription: 'Decorative pieces, lighting, and textiles',
        children: [
          {
            name: 'Wall Art',
            shortDescription: 'Paintings, prints, and wall decorations',
          },
          {
            name: 'Candles & Scents',
            shortDescription: 'Aromatic candles and diffusers',
          },
        ],
      },
    ],
  },
  {
    name: 'Sports & Outdoors',
    shortDescription:
      'Athletic gear, fitness equipment, and outdoor adventure supplies',
    imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8',
    children: [
      {
        name: 'Fitness & Gym',
        shortDescription: 'Exercise machines and workout equipment',
        children: [
          {
            name: 'Dumbbells & Weights',
            shortDescription: 'Free weights and lifting gear',
          },
          {
            name: 'Yoga Mats',
            shortDescription: 'Non-slip mats for yoga and stretching',
          },
        ],
      },
      {
        name: 'Outdoor Recreation',
        shortDescription: 'Hiking, camping, and climbing gear',
        children: [
          {
            name: 'Camping Tents',
            shortDescription: 'Temporary shelters for camping',
          },
          {
            name: 'Hiking Backpacks',
            shortDescription: 'Durable packs for outdoor trails',
          },
        ],
      },
    ],
  },
  {
    name: 'Beauty & Health',
    shortDescription:
      'Skincare, cosmetics, personal care, and wellness products',
    imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348',
    children: [
      {
        name: 'Skin Care',
        shortDescription: 'Creams, lotions, and facial treatments',
        children: [
          {
            name: 'Moisturizers',
            shortDescription: 'Hydrating creams and face lotions',
          },
          {
            name: 'Serums & Oils',
            shortDescription: 'Targeted facial serums and natural oils',
          },
        ],
      },
      {
        name: 'Hair Care',
        shortDescription: 'Hair treatment, coloring, and styling tools',
        children: [
          {
            name: 'Shampoos',
            shortDescription: 'Cleansing products for all hair types',
          },
          {
            name: 'Hair Stylers',
            shortDescription: 'Straighteners, curlers, and dryers',
          },
        ],
      },
    ],
  },
  {
    name: 'Groceries & Food',
    shortDescription:
      'Fresh produce, beverages, snacks, and daily household items',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e',
    children: [
      {
        name: 'Fresh Produce',
        shortDescription: 'Fresh vegetables and organic fruits',
        children: [
          {
            name: 'Fruits',
            shortDescription: 'Apples, bananas, berries, and seasonal fruits',
          },
          {
            name: 'Vegetables',
            shortDescription: 'Leafy greens, roots, and seasonal vegetables',
          },
        ],
      },
      {
        name: 'Beverages',
        shortDescription: 'Soft drinks, juices, and hot brews',
        children: [
          {
            name: 'Coffee & Tea',
            shortDescription: 'Beans, tea bags, and ground blends',
          },
          {
            name: 'Soft Drinks',
            shortDescription: 'Carbonated water, colas, and energy drinks',
          },
        ],
      },
    ],
  },
  {
    name: 'Books & Stationery',
    shortDescription:
      'Fiction, non-fiction, notebooks, pens, and office stationery',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6',
    children: [
      {
        name: 'Fiction Books',
        shortDescription: 'Novels, storybooks, and literature',
        children: [
          {
            name: 'Sci-Fi & Fantasy',
            shortDescription: 'Science fiction and fantasy novels',
          },
          {
            name: 'Mystery & Thriller',
            shortDescription: 'Suspense and detective stories',
          },
        ],
      },
      {
        name: 'Office Stationery',
        shortDescription: 'Supplies for writing and organizing',
        children: [
          {
            name: 'Notebooks & Journals',
            shortDescription: 'Paper books for notes and logs',
          },
          {
            name: 'Pens & Markers',
            shortDescription: 'Gel pens, ballpoints, and highlighters',
          },
        ],
      },
    ],
  },
  {
    name: 'Toys & Games',
    shortDescription: 'Board games, puzzles, action figures, and kids toys',
    imageUrl: 'https://images.unsplash.com/photo-1539627831859-a911cf04d3cd',
    children: [
      {
        name: 'Board Games',
        shortDescription: 'Tabletop strategy and family games',
        children: [
          {
            name: 'Strategy Games',
            shortDescription: 'Complex tabletop games requiring planning',
          },
          {
            name: 'Family Games',
            shortDescription: 'Fun and easy-to-learn games for all ages',
          },
        ],
      },
      {
        name: 'Action Figures & Dolls',
        shortDescription: 'Collectible figures and toy dolls',
        children: [
          {
            name: 'Superheroes',
            shortDescription: 'Collectible action figures of comic heroes',
          },
          {
            name: 'Fashion Dolls',
            shortDescription: 'Dolls and related dress-up accessories',
          },
        ],
      },
    ],
  },
  {
    name: 'Automotive & Vehicles',
    shortDescription: 'Car parts, vehicle accessories, and maintenance tools',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b',
    children: [
      {
        name: 'Car Accessories',
        shortDescription: 'Interior and exterior vehicle accessories',
        children: [
          {
            name: 'Seat Covers',
            shortDescription: 'Protective covers for car seats',
          },
          {
            name: 'GPS Navigation',
            shortDescription: 'Dashboard maps and tracking systems',
          },
        ],
      },
      {
        name: 'Vehicle Care',
        shortDescription: 'Washing, polishing, and detailing supplies',
        children: [
          {
            name: 'Car Wash Liquid',
            shortDescription: 'Shampoos formulated for car exteriors',
          },
          {
            name: 'Waxes & Polishes',
            shortDescription: 'Gloss-enhancing protective compounds',
          },
        ],
      },
    ],
  },
  {
    name: 'Baby & Maternity',
    shortDescription: 'Baby clothes, diapers, strollers, and maternity wear',
    imageUrl: 'https://images.unsplash.com/photo-1522336572468-97b06eca215b',
    children: [
      {
        name: 'Baby Clothing',
        shortDescription: 'Outfits, suits, and accessories for infants',
        children: [
          {
            name: 'Onesies',
            shortDescription: 'Comfortable one-piece baby wear',
          },
          {
            name: 'Sleepwear',
            shortDescription: 'Soft pajamas and sleep sacks',
          },
        ],
      },
      {
        name: 'Baby Gear',
        shortDescription: 'Transportation and nursery gear',
        children: [
          {
            name: 'Strollers',
            shortDescription: 'Pushchairs for babies and toddlers',
          },
          {
            name: 'Car Seats',
            shortDescription: 'Safety-certified automobile baby seats',
          },
        ],
      },
    ],
  },
  {
    name: 'Furniture & Decor',
    shortDescription:
      'Living room, bedroom, and office furniture and decorations',
    imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36',
    children: [
      {
        name: 'Living Room Furniture',
        shortDescription: 'Sofas, armchairs, and media units',
        children: [
          {
            name: 'Sofas & Couches',
            shortDescription: 'Multi-seat upholstered couches',
          },
          {
            name: 'Coffee Tables',
            shortDescription: 'Central low tables for living rooms',
          },
        ],
      },
      {
        name: 'Bedroom Furniture',
        shortDescription: 'Beds, mattresses, and closets',
        children: [
          {
            name: 'Beds & Mattresses',
            shortDescription: 'Bedframes and comfortable mattresses',
          },
          {
            name: 'Wardrobes',
            shortDescription: 'Closets for hanging and storing apparel',
          },
        ],
      },
    ],
  },
  {
    name: 'Tools & Hardware',
    shortDescription:
      'Hand tools, power tools, building materials, and hardware',
    imageUrl: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189',
    children: [
      {
        name: 'Hand Tools',
        shortDescription: 'Manual tools for everyday maintenance',
        children: [
          {
            name: 'Screwdrivers',
            shortDescription: 'Manual slot and crosshead drivers',
          },
          {
            name: 'Hammers & Mallets',
            shortDescription: 'Claw hammers and rubber mallets',
          },
        ],
      },
      {
        name: 'Power Tools',
        shortDescription: 'Electric and battery-operated tools',
        children: [
          {
            name: 'Cordless Drills',
            shortDescription: 'Rechargeable battery-powered drills',
          },
          {
            name: 'Circular Saws',
            shortDescription: 'Electric round-blade cutting saws',
          },
        ],
      },
    ],
  },
  {
    name: 'Pet Supplies',
    shortDescription:
      'Pet food, toys, grooming products, and pet care accessories',
    imageUrl: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7',
    children: [
      {
        name: 'Dog Supplies',
        shortDescription: 'Dog food, treats, collars, and leashes',
        children: [
          {
            name: 'Dog Food',
            shortDescription: 'Dry kibble and canned wet dog food',
          },
          {
            name: 'Dog Toys',
            shortDescription: 'Chew toys, fetch balls, and tug ropes',
          },
        ],
      },
      {
        name: 'Cat Supplies',
        shortDescription: 'Cat food, litter, and scratchers',
        children: [
          {
            name: 'Cat Food',
            shortDescription: 'Kibble and premium wet cat food',
          },
          {
            name: 'Cat Litter',
            shortDescription: 'Clumping and odor-control litters',
          },
        ],
      },
    ],
  },
  {
    name: 'Office Supplies',
    shortDescription:
      'Desk organizers, paper, calculators, and office essentials',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8',
    children: [
      {
        name: 'Desk Accessories',
        shortDescription: 'Desktop organizers, stands, and pads',
        children: [
          {
            name: 'Desk Organizers',
            shortDescription: 'Pen holders, sorting trays, and caddies',
          },
          {
            name: 'Desk Mats',
            shortDescription: 'Large leather or fabric desk protector pads',
          },
        ],
      },
      {
        name: 'Office Electronics',
        shortDescription: 'Workplace equipment and tech accessories',
        children: [
          {
            name: 'Paper Shredders',
            shortDescription: 'Devices for destroying sensitive documents',
          },
          {
            name: 'Label Makers',
            shortDescription: 'Portable printing devices for labeling files',
          },
        ],
      },
    ],
  },
  {
    name: 'Musical Instruments',
    shortDescription: 'Guitars, keyboards, drums, and musical accessories',
    imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629',
    children: [
      {
        name: 'String Instruments',
        shortDescription: 'Guitars, violins, cellos, and ukuleles',
        children: [
          {
            name: 'Acoustic Guitars',
            shortDescription: 'Standard wooden hollow-body guitars',
          },
          {
            name: 'Violins',
            shortDescription: 'Wooden bowed string instruments',
          },
        ],
      },
      {
        name: 'Keyboard Instruments',
        shortDescription: 'Acoustic pianos, synthesizers, and key controllers',
        children: [
          {
            name: 'Digital Pianos',
            shortDescription: 'Full-sized weighted electric pianos',
          },
          {
            name: 'MIDI Controllers',
            shortDescription: 'USB keyboards for music production',
          },
        ],
      },
    ],
  },
  {
    name: 'Jewellery & Watches',
    shortDescription:
      'Rings, necklaces, bracelets, smartwatches, and classic timepieces',
    imageUrl: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3',
    children: [
      {
        name: 'Fine Jewellery',
        shortDescription: 'Gold, silver, and diamond adornments',
        children: [
          {
            name: 'Gold Necklaces',
            shortDescription: 'Neck chains made of 18k or 24k gold',
          },
          {
            name: 'Diamond Rings',
            shortDescription: 'Engagement and wedding diamond rings',
          },
        ],
      },
      {
        name: 'Watches',
        shortDescription: 'Wristwatches and smart wear',
        children: [
          {
            name: 'Smartwatches',
            shortDescription: 'Digital activity and message tracking watches',
          },
          {
            name: 'Analog Watches',
            shortDescription: 'Classic quartz or mechanical watches',
          },
        ],
      },
    ],
  },
  {
    name: 'Art & Crafts',
    shortDescription:
      'Paints, canvases, knitting supplies, and craft materials',
    imageUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b',
    children: [
      {
        name: 'Painting Supplies',
        shortDescription: 'Paints, mediums, and brushes',
        children: [
          {
            name: 'Acrylic Paints',
            shortDescription: 'Water-based quick-drying acrylic colors',
          },
          {
            name: 'Paint Brushes',
            shortDescription: 'Assorted fine-art brush sets',
          },
        ],
      },
      {
        name: 'Crafting Materials',
        shortDescription: 'General crafting consumables and adhesives',
        children: [
          {
            name: 'Sewing Kits',
            shortDescription: 'Needles, threads, and scissors',
          },
          {
            name: 'Glue Guns & Adhesives',
            shortDescription: 'Hot melt glue guns and crafting glues',
          },
        ],
      },
    ],
  },
  {
    name: 'Travel & Luggage',
    shortDescription:
      'Suitcases, travel bags, backpacks, and travel accessories',
    imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
    children: [
      {
        name: 'Suitcases',
        shortDescription: 'Wheeled luggage bags for vacation travel',
        children: [
          {
            name: 'Hardside Luggage',
            shortDescription: 'Polycarbonate shell protective suitcases',
          },
          {
            name: 'Carry-on Bags',
            shortDescription: 'Cabin-approved small luggage cases',
          },
        ],
      },
      {
        name: 'Travel Accessories',
        shortDescription: 'Travel comfort, organizer and safety accessories',
        children: [
          {
            name: 'Neck Pillows',
            shortDescription: 'Ergonomic foam cushions for transit sleep',
          },
          {
            name: 'Luggage Tags',
            shortDescription: 'Identification tags for luggage bags',
          },
        ],
      },
    ],
  },
  {
    name: 'Garden & Outdoors',
    shortDescription: 'Plants, seeds, lawn mowers, and gardening tools',
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b',
    children: [
      {
        name: 'Gardening Tools',
        shortDescription: 'Manual and motorized yard maintenance gear',
        children: [
          {
            name: 'Pruning Shears',
            shortDescription: 'Hand shears for trimming plants',
          },
          {
            name: 'Watering Cans',
            shortDescription: 'Portable containers with spray nozzles',
          },
        ],
      },
      {
        name: 'Outdoor Plants & Seeds',
        shortDescription: 'Flowering plants, seeds, and soil mixes',
        children: [
          {
            name: 'Flower Seeds',
            shortDescription: 'Packets of wild and garden flower seeds',
          },
          {
            name: 'Indoor Plants',
            shortDescription: 'Potted plants suitable for indoor lighting',
          },
        ],
      },
    ],
  },
  {
    name: 'Industrial & Scientific',
    shortDescription: 'Lab equipment, safety gear, and industrial supplies',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb',
    children: [
      {
        name: 'Lab Equipment',
        shortDescription: 'Measurement tools, test tubes, and analysis kits',
        children: [
          {
            name: 'Microscopes',
            shortDescription: 'Optical magnifying instruments for labs',
          },
          {
            name: 'Test Tubes',
            shortDescription: 'Glass tubes for chemical and biological testing',
          },
        ],
      },
      {
        name: 'Safety & Protection',
        shortDescription: 'Personal protective equipment for sites and labs',
        children: [
          {
            name: 'Safety Glasses',
            shortDescription: 'Clear impact-resistant protective eyewear',
          },
          {
            name: 'Protective Gloves',
            shortDescription: 'Heavy-duty safety and nitrile gloves',
          },
        ],
      },
    ],
  },
];

async function seedCategoryNode(
  manager: EntityManager,
  node: CategoryNode,
  parentId: string | null = null,
): Promise<void> {
  const slug = generateSlug(node.name);
  const exists = await manager.findOne(Category, {
    where: { name: node.name },
  });

  let category: Category;
  if (!exists) {
    const categoryData: Partial<Category> = {
      name: node.name,
      slug: slug,
      shortDescription: node.shortDescription,
      longDescription:
        node.longDescription ||
        `Detailed long description for the ${node.name} category, featuring premium selection and curated options.`,
      status: StatusTypeEnum.PUBLISHED,
      isActive: true,
      parentId: parentId,
    };
    if (node.imageUrl) {
      categoryData.imageUrl = node.imageUrl;
    }
    category = await manager.save(Category, categoryData);
  } else {
    // If it exists, update it to make sure the hierarchy parent ID is correctly set up
    exists.parentId = parentId;
    if (node.imageUrl) {
      exists.imageUrl = node.imageUrl;
    }
    category = await manager.save(Category, exists);
  }

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      await seedCategoryNode(manager, child, category.id);
    }
  }
}

async function seedCategories(): Promise<void> {
  await dataSource.initialize();

  const manager = dataSource.manager;

  console.log('Seeding categories tree structure (3 levels)...');
  for (const node of CATEGORIES_DATA) {
    await seedCategoryNode(manager, node, null);
  }

  console.log('Category tree seeding completed successfully!');
}

seedCategories()
  .catch((error) => {
    console.error('Category seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(0);
  });

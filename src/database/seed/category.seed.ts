import dataSource from '../data-source';
import { Category } from 'src/modules/categories/entities/category.entity';
import { StatusTypeEnum } from 'src/common/enums/status-type.enum';
import { generateSlug } from 'src/common/utils/generate-slug.util';
import { EntityManager } from 'typeorm';

interface CategoryNode {
  name: string;
  description: string;
  imageUrl?: string;
  children?: CategoryNode[];
}

const CATEGORIES_DATA: CategoryNode[] = [
  {
    name: 'Electronics',
    description:
      'Gadgets, smart devices, computers, and electronic accessories',
    imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661',
    children: [
      {
        name: 'Laptops & Computers',
        description: 'Computers, notebooks, and essential computing devices',
        children: [
          {
            name: 'Gaming Laptops',
            description: 'High-performance gaming machines',
          },
          {
            name: 'Accessories & Keyboards',
            description: 'Mice, keyboards, and input accessories',
          },
        ],
      },
      {
        name: 'Smart Phones & Tablets',
        description: 'Mobile devices, phones, and touch tablets',
        children: [
          {
            name: 'Android Devices',
            description: 'Smartphones and tablets running Android',
          },
          { name: 'iOS Devices', description: 'iPhones and iPads' },
        ],
      },
    ],
  },
  {
    name: 'Fashion & Apparel',
    description: 'Clothing, footwear, and accessories for men, women, and kids',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b',
    children: [
      {
        name: "Men's Clothing",
        description: 'Menswear, shirts, trousers, and outerwear',
        children: [
          {
            name: 'Shirts & T-Shirts',
            description: 'Casual and formal tops for men',
          },
          {
            name: 'Pants & Jeans',
            description: 'Denim and formal trousers for men',
          },
        ],
      },
      {
        name: "Women's Clothing",
        description: 'Womenswear, dresses, tops, and skirts',
        children: [
          { name: 'Dresses', description: 'One-piece dresses and gowns' },
          { name: 'Tops & Blouses', description: 'Fashionable tops for women' },
        ],
      },
    ],
  },
  {
    name: 'Home & Living',
    description: 'Home decor, kitchenware, furniture, and living essentials',
    imageUrl: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a',
    children: [
      {
        name: 'Kitchen & Dining',
        description: 'Cookware, tableware, and small appliances',
        children: [
          { name: 'Cookware', description: 'Pots, pans, and baking dishes' },
          {
            name: 'Coffee Makers',
            description: 'Espresso and filter coffee brewing devices',
          },
        ],
      },
      {
        name: 'Home Decor',
        description: 'Decorative pieces, lighting, and textiles',
        children: [
          {
            name: 'Wall Art',
            description: 'Paintings, prints, and wall decorations',
          },
          {
            name: 'Candles & Scents',
            description: 'Aromatic candles and diffusers',
          },
        ],
      },
    ],
  },
  {
    name: 'Sports & Outdoors',
    description:
      'Athletic gear, fitness equipment, and outdoor adventure supplies',
    imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8',
    children: [
      {
        name: 'Fitness & Gym',
        description: 'Exercise machines and workout equipment',
        children: [
          {
            name: 'Dumbbells & Weights',
            description: 'Free weights and lifting gear',
          },
          {
            name: 'Yoga Mats',
            description: 'Non-slip mats for yoga and stretching',
          },
        ],
      },
      {
        name: 'Outdoor Recreation',
        description: 'Hiking, camping, and climbing gear',
        children: [
          {
            name: 'Camping Tents',
            description: 'Temporary shelters for camping',
          },
          {
            name: 'Hiking Backpacks',
            description: 'Durable packs for outdoor trails',
          },
        ],
      },
    ],
  },
  {
    name: 'Beauty & Health',
    description: 'Skincare, cosmetics, personal care, and wellness products',
    imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348',
    children: [
      {
        name: 'Skin Care',
        description: 'Creams, lotions, and facial treatments',
        children: [
          {
            name: 'Moisturizers',
            description: 'Hydrating creams and face lotions',
          },
          {
            name: 'Serums & Oils',
            description: 'Targeted facial serums and natural oils',
          },
        ],
      },
      {
        name: 'Hair Care',
        description: 'Hair treatment, coloring, and styling tools',
        children: [
          {
            name: 'Shampoos',
            description: 'Cleansing products for all hair types',
          },
          {
            name: 'Hair Stylers',
            description: 'Straighteners, curlers, and dryers',
          },
        ],
      },
    ],
  },
  {
    name: 'Groceries & Food',
    description: 'Fresh produce, beverages, snacks, and daily household items',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e',
    children: [
      {
        name: 'Fresh Produce',
        description: 'Fresh vegetables and organic fruits',
        children: [
          {
            name: 'Fruits',
            description: 'Apples, bananas, berries, and seasonal fruits',
          },
          {
            name: 'Vegetables',
            description: 'Leafy greens, roots, and seasonal vegetables',
          },
        ],
      },
      {
        name: 'Beverages',
        description: 'Soft drinks, juices, and hot brews',
        children: [
          {
            name: 'Coffee & Tea',
            description: 'Beans, tea bags, and ground blends',
          },
          {
            name: 'Soft Drinks',
            description: 'Carbonated water, colas, and energy drinks',
          },
        ],
      },
    ],
  },
  {
    name: 'Books & Stationery',
    description: 'Fiction, non-fiction, notebooks, pens, and office stationery',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6',
    children: [
      {
        name: 'Fiction Books',
        description: 'Novels, storybooks, and literature',
        children: [
          {
            name: 'Sci-Fi & Fantasy',
            description: 'Science fiction and fantasy novels',
          },
          {
            name: 'Mystery & Thriller',
            description: 'Suspense and detective stories',
          },
        ],
      },
      {
        name: 'Office Stationery',
        description: 'Supplies for writing and organizing',
        children: [
          {
            name: 'Notebooks & Journals',
            description: 'Paper books for notes and logs',
          },
          {
            name: 'Pens & Markers',
            description: 'Gel pens, ballpoints, and highlighters',
          },
        ],
      },
    ],
  },
  {
    name: 'Toys & Games',
    description: 'Board games, puzzles, action figures, and kids toys',
    imageUrl: 'https://images.unsplash.com/photo-1539627831859-a911cf04d3cd',
    children: [
      {
        name: 'Board Games',
        description: 'Tabletop strategy and family games',
        children: [
          {
            name: 'Strategy Games',
            description: 'Complex tabletop games requiring planning',
          },
          {
            name: 'Family Games',
            description: 'Fun and easy-to-learn games for all ages',
          },
        ],
      },
      {
        name: 'Action Figures & Dolls',
        description: 'Collectible figures and toy dolls',
        children: [
          {
            name: 'Superheroes',
            description: 'Collectible action figures of comic heroes',
          },
          {
            name: 'Fashion Dolls',
            description: 'Dolls and related dress-up accessories',
          },
        ],
      },
    ],
  },
  {
    name: 'Automotive & Vehicles',
    description: 'Car parts, vehicle accessories, and maintenance tools',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b',
    children: [
      {
        name: 'Car Accessories',
        description: 'Interior and exterior vehicle accessories',
        children: [
          {
            name: 'Seat Covers',
            description: 'Protective covers for car seats',
          },
          {
            name: 'GPS Navigation',
            description: 'Dashboard maps and tracking systems',
          },
        ],
      },
      {
        name: 'Vehicle Care',
        description: 'Washing, polishing, and detailing supplies',
        children: [
          {
            name: 'Car Wash Liquid',
            description: 'Shampoos formulated for car exteriors',
          },
          {
            name: 'Waxes & Polishes',
            description: 'Gloss-enhancing protective compounds',
          },
        ],
      },
    ],
  },
  {
    name: 'Baby & Maternity',
    description: 'Baby clothes, diapers, strollers, and maternity wear',
    imageUrl: 'https://images.unsplash.com/photo-1522336572468-97b06eca215b',
    children: [
      {
        name: 'Baby Clothing',
        description: 'Outfits, suits, and accessories for infants',
        children: [
          { name: 'Onesies', description: 'Comfortable one-piece baby wear' },
          { name: 'Sleepwear', description: 'Soft pajamas and sleep sacks' },
        ],
      },
      {
        name: 'Baby Gear',
        description: 'Transportation and nursery gear',
        children: [
          {
            name: 'Strollers',
            description: 'Pushchairs for babies and toddlers',
          },
          {
            name: 'Car Seats',
            description: 'Safety-certified automobile baby seats',
          },
        ],
      },
    ],
  },
  {
    name: 'Furniture & Decor',
    description: 'Living room, bedroom, and office furniture and decorations',
    imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36',
    children: [
      {
        name: 'Living Room Furniture',
        description: 'Sofas, armchairs, and media units',
        children: [
          {
            name: 'Sofas & Couches',
            description: 'Multi-seat upholstered couches',
          },
          {
            name: 'Coffee Tables',
            description: 'Central low tables for living rooms',
          },
        ],
      },
      {
        name: 'Bedroom Furniture',
        description: 'Beds, mattresses, and closets',
        children: [
          {
            name: 'Beds & Mattresses',
            description: 'Bedframes and comfortable mattresses',
          },
          {
            name: 'Wardrobes',
            description: 'Closets for hanging and storing apparel',
          },
        ],
      },
    ],
  },
  {
    name: 'Tools & Hardware',
    description: 'Hand tools, power tools, building materials, and hardware',
    imageUrl: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189',
    children: [
      {
        name: 'Hand Tools',
        description: 'Manual tools for everyday maintenance',
        children: [
          {
            name: 'Screwdrivers',
            description: 'Manual slot and crosshead drivers',
          },
          {
            name: 'Hammers & Mallets',
            description: 'Claw hammers and rubber mallets',
          },
        ],
      },
      {
        name: 'Power Tools',
        description: 'Electric and battery-operated tools',
        children: [
          {
            name: 'Cordless Drills',
            description: 'Rechargeable battery-powered drills',
          },
          {
            name: 'Circular Saws',
            description: 'Electric round-blade cutting saws',
          },
        ],
      },
    ],
  },
  {
    name: 'Pet Supplies',
    description: 'Pet food, toys, grooming products, and pet care accessories',
    imageUrl: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7',
    children: [
      {
        name: 'Dog Supplies',
        description: 'Dog food, treats, collars, and leashes',
        children: [
          {
            name: 'Dog Food',
            description: 'Dry kibble and canned wet dog food',
          },
          {
            name: 'Dog Toys',
            description: 'Chew toys, fetch balls, and tug ropes',
          },
        ],
      },
      {
        name: 'Cat Supplies',
        description: 'Cat food, litter, and scratchers',
        children: [
          { name: 'Cat Food', description: 'Kibble and premium wet cat food' },
          {
            name: 'Cat Litter',
            description: 'Clumping and odor-control litters',
          },
        ],
      },
    ],
  },
  {
    name: 'Office Supplies',
    description: 'Desk organizers, paper, calculators, and office essentials',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8',
    children: [
      {
        name: 'Desk Accessories',
        description: 'Desktop organizers, stands, and pads',
        children: [
          {
            name: 'Desk Organizers',
            description: 'Pen holders, sorting trays, and caddies',
          },
          {
            name: 'Desk Mats',
            description: 'Large leather or fabric desk protector pads',
          },
        ],
      },
      {
        name: 'Office Electronics',
        description: 'Workplace equipment and tech accessories',
        children: [
          {
            name: 'Paper Shredders',
            description: 'Devices for destroying sensitive documents',
          },
          {
            name: 'Label Makers',
            description: 'Portable printing devices for labeling files',
          },
        ],
      },
    ],
  },
  {
    name: 'Musical Instruments',
    description: 'Guitars, keyboards, drums, and musical accessories',
    imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629',
    children: [
      {
        name: 'String Instruments',
        description: 'Guitars, violins, cellos, and ukuleles',
        children: [
          {
            name: 'Acoustic Guitars',
            description: 'Standard wooden hollow-body guitars',
          },
          { name: 'Violins', description: 'Wooden bowed string instruments' },
        ],
      },
      {
        name: 'Keyboard Instruments',
        description: 'Acoustic pianos, synthesizers, and key controllers',
        children: [
          {
            name: 'Digital Pianos',
            description: 'Full-sized weighted electric pianos',
          },
          {
            name: 'MIDI Controllers',
            description: 'USB keyboards for music production',
          },
        ],
      },
    ],
  },
  {
    name: 'Jewellery & Watches',
    description:
      'Rings, necklaces, bracelets, smartwatches, and classic timepieces',
    imageUrl: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3',
    children: [
      {
        name: 'Fine Jewellery',
        description: 'Gold, silver, and diamond adornments',
        children: [
          {
            name: 'Gold Necklaces',
            description: 'Neck chains made of 18k or 24k gold',
          },
          {
            name: 'Diamond Rings',
            description: 'Engagement and wedding diamond rings',
          },
        ],
      },
      {
        name: 'Watches',
        description: 'Wristwatches and smart wear',
        children: [
          {
            name: 'Smartwatches',
            description: 'Digital activity and message tracking watches',
          },
          {
            name: 'Analog Watches',
            description: 'Classic quartz or mechanical watches',
          },
        ],
      },
    ],
  },
  {
    name: 'Art & Crafts',
    description: 'Paints, canvases, knitting supplies, and craft materials',
    imageUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b',
    children: [
      {
        name: 'Painting Supplies',
        description: 'Paints, mediums, and brushes',
        children: [
          {
            name: 'Acrylic Paints',
            description: 'Water-based quick-drying acrylic colors',
          },
          {
            name: 'Paint Brushes',
            description: 'Assorted fine-art brush sets',
          },
        ],
      },
      {
        name: 'Crafting Materials',
        description: 'General crafting consumables and adhesives',
        children: [
          {
            name: 'Sewing Kits',
            description: 'Needles, threads, and scissors',
          },
          {
            name: 'Glue Guns & Adhesives',
            description: 'Hot melt glue guns and crafting glues',
          },
        ],
      },
    ],
  },
  {
    name: 'Travel & Luggage',
    description: 'Suitcases, travel bags, backpacks, and travel accessories',
    imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
    children: [
      {
        name: 'Suitcases',
        description: 'Wheeled luggage bags for vacation travel',
        children: [
          {
            name: 'Hardside Luggage',
            description: 'Polycarbonate shell protective suitcases',
          },
          {
            name: 'Carry-on Bags',
            description: 'Cabin-approved small luggage cases',
          },
        ],
      },
      {
        name: 'Travel Accessories',
        description: 'Travel comfort, organizer and safety accessories',
        children: [
          {
            name: 'Neck Pillows',
            description: 'Ergonomic foam cushions for transit sleep',
          },
          {
            name: 'Luggage Tags',
            description: 'Identification tags for luggage bags',
          },
        ],
      },
    ],
  },
  {
    name: 'Garden & Outdoors',
    description: 'Plants, seeds, lawn mowers, and gardening tools',
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b',
    children: [
      {
        name: 'Gardening Tools',
        description: 'Manual and motorized yard maintenance gear',
        children: [
          {
            name: 'Pruning Shears',
            description: 'Hand shears for trimming plants',
          },
          {
            name: 'Watering Cans',
            description: 'Portable containers with spray nozzles',
          },
        ],
      },
      {
        name: 'Outdoor Plants & Seeds',
        description: 'Flowering plants, seeds, and soil mixes',
        children: [
          {
            name: 'Flower Seeds',
            description: 'Packets of wild and garden flower seeds',
          },
          {
            name: 'Indoor Plants',
            description: 'Potted plants suitable for indoor lighting',
          },
        ],
      },
    ],
  },
  {
    name: 'Industrial & Scientific',
    description: 'Lab equipment, safety gear, and industrial supplies',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb',
    children: [
      {
        name: 'Lab Equipment',
        description: 'Measurement tools, test tubes, and analysis kits',
        children: [
          {
            name: 'Microscopes',
            description: 'Optical magnifying instruments for labs',
          },
          {
            name: 'Test Tubes',
            description: 'Glass tubes for chemical and biological testing',
          },
        ],
      },
      {
        name: 'Safety & Protection',
        description: 'Personal protective equipment for sites and labs',
        children: [
          {
            name: 'Safety Glasses',
            description: 'Clear impact-resistant protective eyewear',
          },
          {
            name: 'Protective Gloves',
            description: 'Heavy-duty safety and nitrile gloves',
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
    const categoryData: any = {
      name: node.name,
      slug: slug,
      description: node.description,
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

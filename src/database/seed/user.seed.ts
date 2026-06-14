import * as argon from 'argon2';
import dataSource from '../data-source';
import { AuthProviderTypeEnum } from 'src/common/enums/auth-providerType.enum';
import { UserRoleEnum } from 'src/common/enums/user-role.enum';
import { UserStatusEnum } from 'src/common/enums/user-status.enum';
import { VendorStatusEnum } from 'src/common/enums/vendor-status.enum';
import { CustomerProfile } from 'src/modules/users/entities/customer-profile.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { VendorProfile } from 'src/modules/users/entities/vendor-profile.entity';

const SEED_PASSWORD = 'Password@123';
const CUSTOMER_COUNT = 50;
const VENDOR_COUNT = 40;

const ADMIN_EMAIL = 'admin@gmail.com';

async function seedUsers(): Promise<void> {
  await dataSource.initialize();

  const manager = dataSource.manager;
  const hashedPassword = await argon.hash(SEED_PASSWORD);

  const existingAdmin = await manager.findOne(User, {
    where: { email: ADMIN_EMAIL },
  });

  if (!existingAdmin) {
    await manager.save(User, {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      status: UserStatusEnum.ACTIVE,
      role: UserRoleEnum.ADMIN,
      authProviderType: AuthProviderTypeEnum.EMAIL,
    });
    console.log(`Created admin: ${ADMIN_EMAIL}`);
  } else {
    console.log(`Skipped admin (already exists): ${ADMIN_EMAIL}`);
  }

  let customersCreated = 0;
  let customersSkipped = 0;

  for (let i = 1; i <= CUSTOMER_COUNT; i++) {
    const email = `customer${i}@example.com`;
    const exists = await manager.findOne(User, { where: { email } });

    if (exists) {
      customersSkipped++;
      continue;
    }

    const user = await manager.save(User, {
      email,
      password: hashedPassword,
      status: UserStatusEnum.ACTIVE,
      role: UserRoleEnum.CUSTOMER,
      authProviderType: AuthProviderTypeEnum.EMAIL,
    });

    await manager.save(CustomerProfile, {
      userId: user.id,
      firstName: 'Customer',
      lastName: `${i}`,
      phoneNumber: `+97798123${String(i).padStart(5, '0')}`,
    });

    customersCreated++;
  }

  console.log(
    `Customers: ${customersCreated} created, ${customersSkipped} skipped`,
  );

  let vendorsCreated = 0;
  let vendorsSkipped = 0;

  for (let i = 1; i <= VENDOR_COUNT; i++) {
    const email = `vendor${i}@example.com`;
    const exists = await manager.findOne(User, { where: { email } });

    if (exists) {
      vendorsSkipped++;
      continue;
    }

    const user = await manager.save(User, {
      email,
      password: hashedPassword,
      status: UserStatusEnum.ACTIVE,
      role: UserRoleEnum.VENDOR,
      authProviderType: AuthProviderTypeEnum.EMAIL,
    });

    await manager.save(VendorProfile, {
      userId: user.id,
      businessName: `Vendor Business ${i}`,
      businessProfileUrl: `https://example.com/vendors/vendor${i}`,
      vendorStatus: VendorStatusEnum.APPROVED,
      approvedAt: new Date(),
      phoneNumber: `+97798223${String(i).padStart(5, '0')}`,
    });

    vendorsCreated++;
  }

  console.log(`Vendors: ${vendorsCreated} created, ${vendorsSkipped} skipped`);
  console.log(`\nSeed complete. Default password for all users: ${SEED_PASSWORD}`);
  console.log(`Admin login: ${ADMIN_EMAIL}`);
  console.log(`Customer sample: customer1@example.com`);
  console.log(`Vendor sample: vendor1@example.com`);
}

seedUsers()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(0);
  });

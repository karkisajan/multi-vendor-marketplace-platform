import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { VendorProfile } from '../entities/vendor-profile.entity';
import { RegisterVendorDto } from '../dto/register-vendor.dto';

@Injectable()
export class VendorProfileRepository extends Repository<VendorProfile> {
  constructor(dataSource: DataSource) {
    super(VendorProfile, dataSource.createEntityManager());
  }

  /* POST - user profile */
  async createVendorProfile(
    registerVendorDto: RegisterVendorDto,
    userId: string,
    manager: EntityManager,
  ) {
    const userProfile = manager.create(VendorProfile, {
      businessName: registerVendorDto.businessName,
      phoneNumber: registerVendorDto.phoneNumber,
      userId: userId,
    });

    return await manager.save(VendorProfile, userProfile);
  }
}

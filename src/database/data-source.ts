import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { getTypeOrmConfig } from './typeorm.config';

dotenv.config();

const dataSource = new DataSource(getTypeOrmConfig());

export default dataSource;

# Skill: Repository Creation

This skill defines the standard pattern for creating custom repositories in this NestJS application using TypeORM 0.3+.

## Repository Pattern

Every repository must extend the TypeORM `Repository<Entity>` class and be decorated with `@Injectable()`. It should use the `DataSource` to initialize the base `Repository` class.

### File Naming Convention
- Filename: `<entity-name>.repository.ts` (e.g., `user.repository.ts`)
- Location: `src/modules/<module-name>/repositories/`

### Template

```typescript
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { {{EntityName}} } from '../entities/{{entity-file-name}}.entity';

@Injectable()
export class {{EntityName}}Repository extends Repository<{{EntityName}}> {
  constructor(dataSource: DataSource) {
    super({{EntityName}}, dataSource.createEntityManager());
  }

  // Add custom methods below
}
```

## Module Registration

To use the custom repository, it must be added to the `providers` and `exports` of its corresponding module.

### Template for Module

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { {{EntityName}} } from './entities/{{entity-file-name}}.entity';
import { {{EntityName}}Repository } from './repositories/{{entity-file-name}}.repository';

@Module({
  imports: [TypeOrmModule.forFeature([{{EntityName}}])],
  providers: [{{EntityName}}Repository],
  exports: [{{EntityName}}Repository],
})
export class {{ModuleName}}Module {}
```

## Usage in Services

```typescript
@Injectable()
export class {{EntityName}}Service {
  constructor(
    private readonly {{entityInstanceName}}Repository: {{EntityName}}Repository,
  ) {}

  async findOne(id: string) {
    return this.{{entityInstanceName}}Repository.findOne({ where: { id } });
  }
}
```

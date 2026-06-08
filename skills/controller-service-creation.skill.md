# Skill: Controller and Service Creation

This skill defines the standard pattern for creating Services and Controllers in this NestJS application.

## Service Pattern

Services should contain the business logic and interact with Repositories.

### File Naming Convention
- Filename: `<name>.service.ts` (e.g., `user.service.ts`)
- Location: `src/modules/<module-name>/services/`

### Template

```typescript
import { Injectable } from '@nestjs/common';
import { {{EntityName}}Repository } from '../repositories/{{entity-file-name}}.repository';

@Injectable()
export class {{EntityName}}Service {
  constructor(
    private readonly {{entityInstanceName}}Repository: {{EntityName}}Repository,
  ) {}

  // Add business logic methods below
}
```

## Controller Pattern

Controllers handle incoming requests and delegate work to Services.

### File Naming Convention
- Filename: `<name>.controller.ts` (e.g., `user.controller.ts`)
- Location: `src/modules/<module-name>/controllers/`

### Template

```typescript
import { Controller } from '@nestjs/common';
import { {{EntityName}}Service } from '../services/{{entity-file-name}}.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('{{ModuleName}}')
@Controller('{{route-path}}')
export class {{EntityName}}Controller {
  constructor(private readonly {{entityInstanceName}}Service: {{EntityName}}Service) {}

  // Add request handlers below
}
```

## Module Registration

The Service must be added to `providers` and `exports`. The Controller must be added to `controllers`.

### Template for Module

```typescript
import { Module } from '@nestjs/common';
import { {{EntityName}}Controller } from './controllers/{{entity-file-name}}.controller';
import { {{EntityName}}Service } from './services/{{entity-file-name}}.service';
// ... other imports

@Module({
  imports: [/* ... */],
  controllers: [{{EntityName}}Controller],
  providers: [{{EntityName}}Service, /* ... repositories */],
  exports: [{{EntityName}}Service],
})
export class {{ModuleName}}Module {}
```

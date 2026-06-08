# Swagger Documentation Standard

To maintain clean controllers, all Swagger documentation decorators should be abstracted into a separate file within a `decorators` folder of the relevant module.

## File Naming Convention
- **Path**: `src/modules/<module-name>/decorators/`
- **Filename**: `<feature-name>-swagger.decorator.ts`

## Implementation Pattern

### 1. Create the Decorator File
Use `applyDecorators` from `@nestjs/common` to combine multiple Swagger decorators.

```typescript
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

export function ApiFeatureName() {
  return applyDecorators(
    ApiOperation({ summary: 'Short description of the action' }),
    ApiBody({ type: MyDto }),
    ApiResponse({ status: 201, description: 'Success message' }),
    ApiResponse({ status: 400, description: 'Validation error' }),
  );
}
```

### 2. Update the DTO
Ensure all DTO properties have `@ApiProperty` to enable schema visualization in Swagger UI.

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class MyDto {
  @ApiProperty({ example: 'value', description: 'desc' })
  propertyName: string;
}
```

### 3. Use in Controller
Import the custom decorator and apply it to the controller method.

```typescript
import { ApiFeatureName } from '../decorators/feature-swagger.decorator';

@Post()
@ApiFeatureName()
async myMethod(@Body() dto: MyDto) {
  return this.service.doSomething(dto);
}
```

## Benefits
- **Readability**: Controllers focus on logic and routing, not documentation boilerplate.
- **Reusability**: Common response patterns can be shared across multiple endpoints.
- **Consistency**: Centralized documentation makes it easier to update descriptions across the entire API.

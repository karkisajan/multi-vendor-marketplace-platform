# Skill: DTO Validation File Creation

Create Data Transfer Object (DTO) classes that validate and describe incoming request payloads using `class-validator` decorators and `@nestjs/swagger` `@ApiProperty` metadata.

Use when the user asks to create a new DTO, add request validation, scaffold a create/update payload, or add input validation to a NestJS endpoint.

## File Naming & Location

- **Filename**: `<action>-<entity>.dto.ts` (e.g., `create-product.dto.ts`, `login-user.dto.ts`)
- **Location**: `src/modules/<module-name>/dto/`
- **Class name**: PascalCase matching the filename — `CreateProductDto`, `LoginUserDto`

## Decorator Stacking Order

Apply decorators **top-to-bottom** in this fixed sequence for every property:

```
1. @ApiProperty()          — Swagger schema metadata (example, description, required)
2. @IsOptional()           — marks the field as not required (only for optional fields)
3. Format validators       — @IsEmail, @IsUUID, @IsEnum, @IsBoolean, @Matches, etc.
4. Length / range guards   — @MinLength, @MaxLength, @Min, @Max
5. Emptiness guards        — @IsNotEmpty (only for required fields)
6. Type guards             — @IsString, @IsNumber, @IsInt, @IsArray
```

> **Why this order?** `class-validator` runs decorators bottom-up. Placing type checks at the bottom ensures they execute first, so a user sees "must be a string" before "must not be empty" — producing the most helpful error first.

## Comment Style for DTO Properties

Add a short `/* ... */` block comment **above each property group** that describes the field's business purpose — not the validation rules (the decorators already express those).

```typescript
/* Email address used for account login and password recovery */
@ApiProperty({ ... })
...
email: string;
```

### What to Comment

| Include | Skip |
|---------|------|
| Business purpose of the field | Restating decorator names ("validates email format") |
| Why a field is optional or required | Obvious fields like `name: string` unless context is needed |
| Enum value meaning when not self-evident | Type information already visible in the signature |
| Constraints that come from business rules | Generic notes like "this is a string field" |

## Required Field Template

Every required field must include `@IsNotEmpty` with a user-friendly message and an `@ApiProperty` with `example` and `description`.

```typescript
/* First name displayed on the customer's public profile */
@ApiProperty({ example: 'John', description: 'First name of the user' })
@MinLength(3, { message: 'First name should be of atleast 3 characters.' })
@IsNotEmpty({ message: 'First name is required.' })
@IsString({ message: 'First name must be a string.' })
firstName: string;
```

## Optional Field Template

Mark with `@IsOptional()` immediately after `@ApiProperty`. Set `required: false` on the `@ApiProperty` and use `?` on the TypeScript property.

```typescript
/* Contact number in E.164 format for order notifications */
@ApiProperty({ example: '+9779812345678', required: false })
@IsOptional()
@IsString({ message: 'Invalid phone number format.' })
@Matches(/^\+?[1-9]\d{1,14}$/, {
  message: 'Invalid phone number format.',
})
phoneNumber?: string;
```

## Common Field Patterns

### Email

```typescript
/* Email address used for authentication and account recovery */
@ApiProperty({
  example: 'john.doe@example.com',
  description: 'Email of the user',
})
@IsNotEmpty({ message: 'Email is required.' })
@IsEmail({}, { message: 'Invalid email format.' })
email: string;
```

### Password (with strength enforcement)

```typescript
/* Account password — enforces uppercase, lowercase, digit, and special char */
@ApiProperty({ example: 'Password@123', description: 'Password of the user' })
@IsNotEmpty({ message: 'Password is required.' })
@MinLength(6, { message: 'Password must be at least 6 characters long.' })
@Matches(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
  {
    message:
      'Password is too weak. It must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
  },
)
password: string;
```

### Enum

```typescript
/* Current activation state of the user account */
@ApiProperty({ enum: UserStatusEnum, required: false })
@IsOptional()
@IsEnum(UserStatusEnum, { message: 'Invalid user status.' })
status: string;
```

### UUID Reference (foreign key)

```typescript
/* Parent category ID for nested category hierarchies */
@ApiProperty({
  example: 'b3d7c8a0-1f2e-4a5b-9c6d-7e8f0a1b2c3d',
  description: 'UUID of the parent category',
  required: false,
})
@IsOptional()
@IsUUID('4', { message: 'Parent ID must be a valid UUID.' })
parentId?: string;
```

### Boolean Toggle

```typescript
/* Controls whether the entity is visible to public-facing queries */
@ApiProperty({ example: true, required: false })
@IsOptional()
@IsBoolean({ message: 'isActive must be a boolean value.' })
isActive?: boolean;
```

### String with Max Length

```typescript
/* Short summary shown in search results and listing cards */
@ApiProperty({
  example: 'Premium wireless headphones',
  description: 'Name of the product',
})
@IsString({ message: 'Please provide a valid product name.' })
@MaxLength(100, { message: 'The product name should not exceed 100 characters.' })
name: string;
```

## Update DTO Pattern

Update DTOs extend the corresponding Create DTO using `PartialType` from `@nestjs/mapped-types` — this makes every field optional automatically. **Do not duplicate field declarations.**

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { Create{{EntityName}}Dto } from './create-{{entity-file-name}}.dto';

/**
 * All fields from Create{{EntityName}}Dto become optional,
 * allowing partial updates without re-declaring validators.
 */
export class Update{{EntityName}}Dto extends PartialType(Create{{EntityName}}Dto) {}
```

## Full Create DTO Example

```typescript
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Payload for creating a new category in the product catalog.
 * Required: name. Optional: description, imageUrl, parentId, isActive.
 */
export class CreateCategoryDto {
  /* Human-readable label shown in navigation menus and breadcrumbs */
  @ApiProperty({ example: 'Electronics', description: 'Name of the category' })
  @IsNotEmpty({ message: 'Category name is required.' })
  @IsString({ message: 'Please provide a valid category name.' })
  @MaxLength(50, {
    message: 'The category name should not exceed 50 characters.',
  })
  name: string;

  /* Extended text displayed on the category landing page */
  @ApiProperty({
    example: 'Gadgets, devices, and accessories',
    description: 'Description of the category',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Please provide a valid category description.' })
  @MaxLength(500, {
    message: 'The description should not exceed 500 characters.',
  })
  description?: string;

  /* CDN URL for the category thumbnail image */
  @ApiProperty({
    example: 'https://cdn.example.com/categories/electronics.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  /* Parent category ID for nested category hierarchies */
  @ApiProperty({
    example: 'b3d7c8a0-1f2e-4a5b-9c6d-7e8f0a1b2c3d',
    description: 'UUID of the parent category',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Parent ID must be a valid UUID.' })
  parentId?: string;

  /* Controls whether the category appears in storefront navigation */
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value.' })
  isActive?: boolean;
}
```

## Validation Error Handling

This project uses a `CustomValidationPipe` (`src/common/pipes/validation.pipe.ts`) registered globally in `main.ts`. It is configured with:

- **`whitelist: true`** — strips properties not defined in the DTO
- **`transform: true`** — auto-transforms payloads into DTO class instances
- **`stopAtFirstError: false`** — collects all validation errors, not just the first

Errors are returned as a `400 BadRequestException` with the shape:

```json
{
  "message": "Validation failed.",
  "details": [
    { "field": "email", "messages": ["Invalid email format."] },
    { "field": "firstName", "messages": ["First name is required."] }
  ]
}
```

> **Write every `message` string as if it will be shown directly to an end user** — clear, polite, and actionable.

## Validation Message Guidelines

1. **Be specific** — name the field and the constraint: `"First name should be of atleast 3 characters."` not `"Too short."`.
2. **Use sentence case** — start with an uppercase letter and end with a period.
3. **Stay consistent** — reuse phrasing patterns across DTOs (e.g., `"X is required."`, `"Invalid X format."`).
4. **Avoid technical jargon** — `"Invalid email format."` not `"Failed IsEmail constraint."`.
5. **Match existing messages** — before writing a new message, check sibling DTOs in the same module for established wording.

## Import Guidelines

Only import the decorators you actually use in the file. Group imports by source:

```typescript
// 1. class-validator — validation decorators
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// 2. Enums — from src/common/enums/
import { UserStatusEnum } from 'src/common/enums/user-status.enum';

// 3. Swagger — API documentation metadata
import { ApiProperty } from '@nestjs/swagger';
```

## Checklist Before Committing a DTO

- [ ] Class name matches the filename in PascalCase
- [ ] Every property has a `/* ... */` comment explaining its business purpose
- [ ] Every required property has `@IsNotEmpty` with a user-friendly message
- [ ] Every optional property has `@IsOptional()` and `?` on the type
- [ ] `@ApiProperty` includes `example` and `description` for required fields
- [ ] `@ApiProperty` includes `required: false` for optional fields
- [ ] Decorators follow the standard stacking order (Swagger → Optional → Format → Length → Empty → Type)
- [ ] Validation messages are clear, specific, and end with a period
- [ ] Unused imports are removed
- [ ] Update DTO uses `PartialType` instead of duplicating fields

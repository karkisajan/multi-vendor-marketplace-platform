# Skill: Unit Testing

Defines the standard pattern for writing Jest unit tests for NestJS services in this application.

## File Naming Convention

- **Filename**: `<name>.service.spec.ts` (e.g., `auth.service.spec.ts`)
- **Location**: Co-located with the service — `src/modules/<module-name>/services/`

## Test Structure

Every service spec file follows this layout:

```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let dependencyA: jest.Mocked<Pick<DependencyA, 'methodUsed'>>;

  beforeEach(async () => {
    // 1. Create mocks
    // 2. Build TestingModule with useValue providers
    // 3. Get service instance
    // 4. Reset mocks (jest.clearAllMocks)
  });

  describe('methodName', () => {
    it('should <expected outcome> when <condition>', async () => {
      // Arrange → Act → Assert
    });
  });
});
```

## Rules

1. **One `describe` block per public method** — group all scenarios for that function together.
2. **Test names use `should ... when ...`** — describe behavior, not implementation.
3. **Arrange → Act → Assert** — separate the three phases clearly in each test.
4. **Mock all external dependencies** — repositories, `DataSource`, `JwtService`, `ConfigService`, `EventEmitter2`, third-party libs (`argon2`).
5. **Do not hit the database** — mock `dataSource.transaction` to invoke the callback with a stub `EntityManager`.
6. **Test outcomes, not internals** — assert return values, thrown exceptions, and side effects (`emit`, `save`, `hash`).
7. **Cover success and failure paths** — at minimum: happy path + each distinct exception the method throws.
8. **Private methods** — test indirectly through the public method that calls them; do not test private methods in isolation.
9. **Keep mocks minimal** — only mock methods the service actually calls.

## NestJS TestingModule Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const userRepository = {
    findUser: jest.fn(),
    registerUser: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: userRepository },
        // ... other mocked providers
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });
});
```

## Mocking Patterns

### TypeORM transaction

```typescript
const dataSource = {
  transaction: jest.fn().mockImplementation(async (cb) =>
    cb({} as EntityManager),
  ),
};
```

### argon2

```typescript
jest.mock('argon2');

import * as argon from 'argon2';

// In test:
(argon.hash as jest.Mock).mockResolvedValue('hashed-value');
(argon.verify as jest.Mock).mockResolvedValue(true);
```

### Event emitter side effects

```typescript
expect(eventEmitter.emit).toHaveBeenCalledWith(
  MAIL_EVENTS.CUSTOMER_REGISTERED,
  expect.any(UserRegistrationEvent),
);
```

### Exception assertions

```typescript
await expect(service.loginUser(dto)).rejects.toThrow(UnauthorizedException);
await expect(service.loginUser(dto)).rejects.toThrow(
  'Invalid email or password.',
);
```

## What to Test Per Method

| Method type | Test |
|-------------|------|
| Create / register | Success response shape, validation errors, duplicate conflicts, side effects (events) |
| Login / auth | Valid credentials, user not found, wrong password |
| Token refresh | Valid token, invalid user, hash mismatch, expired token |
| Password reset | Valid flow, unknown email, expired reset token |
| Private helpers | Covered via public method tests only |

## Path Aliases

Jest requires `moduleNameMapper` in `package.json` to resolve `src/` imports:

```json
"moduleNameMapper": {
  "^src/(.*)$": "<rootDir>/$1"
}
```

## Running Tests

```bash
npm test                          # all unit tests
npm test -- auth.service.spec.ts  # single file
npm run test:cov                  # with coverage
```

## Checklist Before Finishing

- [ ] Every public method has its own `describe` block
- [ ] Happy path and each thrown exception are covered
- [ ] External dependencies are mocked (no DB, no real JWT, no real hashing)
- [ ] `jest.clearAllMocks()` in `beforeEach`
- [ ] Tests pass with `npm test`

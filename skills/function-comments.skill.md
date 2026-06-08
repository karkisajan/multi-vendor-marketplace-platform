# Function Comments

Add concise, meaningful block comments **directly above each function** (not inside the body). Comments should explain *why* and *what happens*, not restate the code.

Use when the user asks to document functions, add function comments, write JSDoc, explain what a function does, or annotate services, controllers, repositories, or utilities.

## Workflow

1. Read the full function body before writing a comment.
2. Identify: purpose, inputs/outputs, side effects (DB, events, email), transactions, and thrown errors.
3. Match existing comment style in the file or module.
4. Add or update the block comment; do not change function logic unless asked.
5. Skip functions that are already well-documented.

## What to Document

| Include | Skip |
|---------|------|
| Business purpose in plain language | Obvious one-liners (`return user.id`) |
| Side effects (transactions, events, emails) | Parameter types already clear from signature |
| Non-obvious validation or security checks | Comments that repeat the function name |
| Return shape when not obvious from types | Step-by-step narration of every line |
| Thrown exceptions when business-meaningful | Getters/setters with self-explanatory names |

## Comment Format (TypeScript / NestJS)

Use JSDoc `/** ... */` blocks. Prefer 2–4 lines for most functions.

### Service / controller handlers (API-facing)

When the function maps to an HTTP endpoint, include an endpoint line, then the description:

```typescript
/**
 * ------ POST - Register user (Customer)
 * Registers a new customer account and creates a customer profile within a single database transaction.
 * Emits a CUSTOMER_REGISTERED event after successful persistence.
 */
async registerCustomer(registerCustomerDto: RegisterCustomerDto) { ... }
```

Endpoint line pattern: `------ <METHOD> - <short action label>`

### Private helpers and utilities

Shorter block — purpose and notable behavior only:

```typescript
/**
 * Verifies that password and confirmPassword match; throws UnauthorizedException if not.
 */
private checkPasswordMatches(dto: RegisterCustomerDto | RegisterVendorDto): void { ... }
```

### Complex logic (multi-step flows)

Use a short summary in the block comment. Reserve inline `/* ... */` comments for non-obvious steps *inside* the body — not as a substitute for the top-level block.

```typescript
/**
 * ------ POST - refresh-token
 * Validates the refresh token signature, confirms token ownership against the stored hash,
 * verifies expiration, and issues a new access token for the authenticated user.
 */
async refreshToken(refreshTokenDto: RefreshTokenDto) { ... }
```

## JSDoc Tags (use sparingly)

Add `@param`, `@returns`, and `@throws` only when the signature alone is insufficient:

```typescript
/**
 * Normalizes and looks up a user by email.
 * @param email - Raw email from the request body
 * @returns The user with profile relations, or null if not found
 */
async findUser(email: string): Promise<User | null> { ... }
```

Do not tag every parameter when TypeScript types and names are already clear.

## Writing Rules

1. **Lead with the outcome** — what the caller gets or what changes in the system.
2. **Use active voice** — "Registers a user", not "This function is used to register".
3. **Be specific** — name entities, events, and error conditions that matter (`ConflictException` for duplicate email, not "throws an error").
4. **Stay accurate** — if the code emits `VENDOR_REGISTERED`, do not write `CUSTOMER_REGISTERED`.
5. **No noise** — avoid filler ("This method", "Function to", "Handles the").
6. **Consistent casing** — match the file (e.g. `Database` vs `database` if the file already uses one).

## Good vs Bad

**Bad** — restates the name, adds no information:
```typescript
/** Registers a customer. */
async registerCustomer(dto: RegisterCustomerDto) { ... }
```

**Good** — explains scope, persistence, and side effects:
```typescript
/**
 * ------ POST - Register user (Customer)
 * Registers a new customer account and creates a customer profile within a single database transaction.
 * Emits a CUSTOMER_REGISTERED event after successful persistence.
 */
async registerCustomer(dto: RegisterCustomerDto) { ... }
```

**Bad** — narrates implementation line by line in the block comment:
```typescript
/**
 * Hashes the password, saves the user, creates the profile, and returns the result.
 */
```

**Good** — groups behavior by intent:
```typescript
/**
 * Creates a customer user and profile atomically; sends a welcome email after commit.
 */
```

## Scope Defaults

- **Document**: public methods, exported functions, non-trivial private methods, repository custom queries, guards, interceptors, pipes with business logic.
- **Usually skip**: constructors (unless non-obvious setup), empty CRUD passthroughs, trivial delegations to a single line.
- **When user says "all functions"**: include private helpers that contain validation, branching, or I/O; skip one-liner wrappers.

## After Editing

- Re-read each comment against the function body for accuracy.
- Ensure no duplicate or stale comments remain after refactors.
- Do not add comments to unrelated code changed in the same file.

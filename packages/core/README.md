# @blank/core

Shared backend primitives

## Structure

- **`/db/`** - Domain-driven design functions with schema/core modules per entity
- **`/ai/`** - AI primitives for entity-based AI methods (e.g., `expense.createFromDescription`)
- **`/utils/`** - Repository-wide utilities (Effect, Neverthrow, etc.)

## SEEDING
- `src/lib/drizzle/seed/*` houses the seeding logic. edit `mock.json` in order to update the data seeded
    - note, some data is randomized on each seed (number of expenses, expense-to-group mappings)
- uses env vars for "me" user:
    - DEV_EMAIL    : sets the email to seed the current user
    - DEV_USERNAME : sets the username to seed the current user (configurable, but this just makes things easier)
 



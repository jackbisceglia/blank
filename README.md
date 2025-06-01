# blank

## Easy Expense Splitting/Tracking

add expense like:
"split lunch with foo, cost bar, 50/50"

parses to structured:

```ts
{
    description: "lunch",
    cost       : <bar>,
    date       : <today>,
    participants: [
        {
            nickname: "USER",
            role    : "payer",
            split   : 0.5
        },
        {
            nickname: <foo>,
            role    : "participant",
            split   : 0.5
        },
    ]
```

## Stack

#### Web:

- Zero Sync Engine
- TanStack
  - Start/Router
  - Form
  - Query
  - Table
- ShadCN/ui

#### Core:

- Effect (and some left over neverthrow)
- Drizzle/Neon DB
- ai/sdk

#### Auth:

- OpenAuth

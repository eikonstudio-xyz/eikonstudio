# `@eikonstudio/bqquery`

Tiny, type-safe BigQuery helpers built on top of `@google-cloud/bigquery`.

## Install

```bash
bun add @eikonstudio/bqquery
```

## Why this package?

`@google-cloud/bigquery` is powerful, but the common query flow usually needs a little ceremony.
`@eikonstudio/bqquery` keeps the everyday path tiny:

- `bq()` creates a client
- `query<T>()` returns typed rows
- `one<T>()` returns the first row or `null`
- `value<T>()` returns the first column from the first row

## Quick Start

```ts
import { bq } from "@eikonstudio/bqquery";

const db = bq({
  projectId: "my-project",
  dataset: "analytics",
  location: "US",
});

const users = await db.query<{ id: string; email: string }>(
  "select id, email from users where active = @active",
  { active: true },
);
```

## Authentication

### Application Default Credentials (ADC)

```ts
import { bq } from "@eikonstudio/bqquery";

const db = bq();
```

### Parsed service-account object

```ts
import { bq } from "@eikonstudio/bqquery";

const db = bq({
  credentials: {
    project_id: "my-project",
    client_email: "service-account@my-project.iam.gserviceaccount.com",
    private_key: process.env.GCP_PRIVATE_KEY!,
  },
});
```

### JSON string

```ts
import { bq } from "@eikonstudio/bqquery";

const db = bq({
  credentialsJson: process.env.GCP_CREDENTIALS,
});
```

### Base64-encoded JSON

```ts
import { bq } from "@eikonstudio/bqquery";

const db = bq({
  credentialsBase64: process.env.GCP_CREDENTIALS_BASE64,
});
```

## Query Helpers

### `query<T>()`

```ts
const rows = await db.query<{ user_id: string; total: number }>(
  `
    select user_id, count(*) as total
    from users
    where created_at >= @since
    group by user_id
  `,
  { since: "2026-01-01" },
);
```

### `one<T>()`

```ts
const user = await db.one<{ id: string; email: string }>(
  "select id, email from users where id = @id limit 1",
  { id: "u_123" },
);
```

### `value<T>()`

```ts
const count = await db.value<number>(
  "select count(*) as total from users where active = @active",
  { active: true },
);
```

## Per-query options

Pass an options object when you need more than just params:

```ts
const rows = await db.query<{ total: number }>(
  "select count(*) as total from users where created_at >= @since",
  {
    params: { since: "2026-01-01" },
    dataset: "warehouse",
    location: "EU",
    maximumBytesBilled: "1000000",
  },
);
```

## Credential helpers

If you need to validate or transform credentials before creating the client:

```ts
import {
  decodeBase64Credentials,
  parseServiceAccountCredentials,
} from "@eikonstudio/bqquery";

const parsed = parseServiceAccountCredentials(process.env.GCP_CREDENTIALS);
const decoded = decodeBase64Credentials(process.env.GCP_CREDENTIALS_BASE64!);
```

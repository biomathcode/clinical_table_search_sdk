# Clinical Table Search SDK

Type-safe, dependency-minimal client for the NIH/NLM Clinical Table Search Service: https://clinicaltables.nlm.nih.gov/

## Install

```sh
npm i clinical-table-search-sdk
```

## Quick Start

```ts
import { ClinicalTablesClient, datasets } from "clinical-table-search-sdk";

const client = ClinicalTablesClient.builder().build();
const hcpcs = client.dataset(datasets.hcpcs);

const res = await hcpcs.search({
  terms: "wheelchair",
  df: ["code", "display"],
  ef: [{ field: "long_desc", as: "long" }],
} as const);

res.items[0]?.code;
res.items[0]?.display; // string[]
res.items[0]?.extra?.long; // unknown
```

## Type-Safe Dataset Params

`df`, `sf`, `cf`, and `ef` are typed per dataset.

```ts
const genes = client.dataset(datasets.genes);

await genes.search({
  terms: "BRCA",
  df: ["symbol", "name_mod"],
  ef: [{ field: "location", as: "loc" }],
} as const);
```

## Composable Debounce/Throttle

The SDK ships small async wrappers you can compose around any async function.

```ts
import { debounce } from "clinical-table-search-sdk";

const searchHcpcs = debounce(
  (terms: string) => hcpcs.search({ terms, df: ["code", "display"] } as const),
  250,
);

const res = await searchHcpcs("wheel");
```

## Table-Friendly Rows

ClinicalTables returns `display` as an array of arrays (in the same order as your `df`).
Use `displayToObjects` to build table rows keyed by your `df`.

```ts
import { displayToObjects } from "clinical-table-search-sdk";

const r = await hcpcs.search({ terms: "wheel", df: ["code", "display"] } as const);
const rows = displayToObjects(["code", "display"] as const, r.display);
```

## Middleware (Composable)

Add request middleware (auth headers, logging, query defaults, etc).

```ts
const client2 = ClinicalTablesClient.builder()
  .use(({ url, init }) => {
    init.headers = { ...(init.headers as Record<string, string>), "x-client": "demo" };
    url.searchParams.set("count", "20");
  })
  .build();
```

## Browser + Node.js

- In browsers: uses global `fetch`.
- In Node.js: requires Node 18+ (global `fetch`), or provide your own `fetch` implementation via the client builder.

```ts
const client3 = ClinicalTablesClient.builder()
  .fetch(fetch) // pass your polyfill / custom fetch if needed
  .build();
```

## Custom Tables

If you want to call a table that isn’t included as a built-in dataset definition, define it:

```ts
import { defineDataset } from "clinical-table-search-sdk";

const myTable = defineDataset({
  id: "my_table",
  version: "v3",
  fields: ["code", "name"] as const,
});
```

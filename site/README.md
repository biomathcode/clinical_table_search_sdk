# Clinical Tables Search SDK Site

Documentation and interactive playground for the `clinical-table-search-sdk`.

## What’s inside

- API Builder: pick any ClinicalTables dataset, configure params (`terms`, `df`, `sf`, `ef`, pagination, dataset-specific params), run the request, and inspect table output + raw JSON.
- Autocomplete demo: live suggestions using the SDK’s `debounce` / `throttle` utilities.
- Dataset catalog: all supported datasets with links to the official API docs.

## Dev

```sh
npm install
npm run dev
```

This Vite app is configured to import the SDK source directly from the repo (via a Vite alias to `../src/index.ts`) so you can iterate on the SDK and the docs site together.

import type {
  ClinicalTablesHttpClient,
  CsvParam,
  EfParam,
  ExtraDataFromEf,
  RequestOptions,
  SearchParamsBase,
  SearchResult,
} from "./types";
import { ClinicalTablesParseError } from "./errors";
import { efToCsv, setCsvQueryParam, setQueryParam, isObject } from "./utils/query";

export type DatasetDefinition<
  Id extends string,
  Version extends string,
  Field extends string,
  ExtraParams extends Record<string, unknown> = {},
> = {
  id: Id;
  version: Version;
  docUrl?: string;
  fields: readonly Field[];
  defaults?: Partial<Omit<SearchParamsBase<Field, CsvParam<Field> | undefined, EfParam<Field> | undefined>, "terms">> &
    Partial<ExtraParams>;
};

export function defineDataset<
  ExtraParams extends Record<string, unknown> = {},
  Id extends string = string,
  Version extends string = string,
  Fields extends readonly string[] = readonly string[],
>(def: {
  id: Id;
  version: Version;
  docUrl?: string;
  fields: Fields;
  defaults?: DatasetDefinition<Id, Version, Fields[number], ExtraParams>["defaults"];
}): DatasetDefinition<Id, Version, Fields[number], ExtraParams> {
  return def as DatasetDefinition<Id, Version, Fields[number], ExtraParams>;
}

export type DatasetSearchParams<
  Field extends string,
  ExtraParams extends Record<string, unknown>,
  Df extends CsvParam<Field> | undefined,
  Ef extends EfParam<Field> | undefined,
> = SearchParamsBase<Field, Df, Ef> & ExtraParams;

export class ClinicalTablesDatasetClient<
  Field extends string,
  ExtraParams extends Record<string, unknown> = {},
> {
  readonly def: DatasetDefinition<string, string, Field, ExtraParams>;
  private readonly client: ClinicalTablesHttpClient;

  constructor(
    client: ClinicalTablesHttpClient,
    def: DatasetDefinition<string, string, Field, ExtraParams>,
  ) {
    this.client = client;
    this.def = def;
  }

  get id(): string {
    return this.def.id;
  }

  get version(): string {
    return this.def.version;
  }

  get searchPath(): string {
    return `/api/${this.def.id}/${this.def.version}/search`;
  }

  async search<
    Df extends CsvParam<Field> | undefined = undefined,
    Ef extends EfParam<Field> | undefined = undefined,
  >(
    params: DatasetSearchParams<Field, ExtraParams, Df, Ef>,
    options?: RequestOptions,
  ): Promise<SearchResult<ExtraDataFromEf<Field, Ef>>> {
    const mergedParams: Record<string, unknown> = {
      ...this.client.defaultSearchParams,
      ...(this.def.defaults ?? {}),
      ...params,
    };

    const url = new URL(this.searchPath, this.client.baseUrl);

    // Standard ClinicalTables query params.
    if (typeof mergedParams.terms !== "string") {
      throw new ClinicalTablesParseError('Missing required search param "terms".');
    }
    url.searchParams.set("terms", mergedParams.terms);
    setQueryParam(url, "maxList", toQueryPrimitive(mergedParams.maxList));
    setQueryParam(url, "count", toQueryPrimitive(mergedParams.count));
    setQueryParam(url, "offset", toQueryPrimitive(mergedParams.offset));
    setQueryParam(url, "q", toQueryPrimitive(mergedParams.q));

    setCsvQueryParam(url, "df", mergedParams.df as CsvParam<string> | undefined);
    setCsvQueryParam(url, "sf", mergedParams.sf as CsvParam<string> | undefined);
    setQueryParam(url, "cf", toQueryPrimitive(mergedParams.cf));
    setQueryParam(url, "ef", efToCsv(mergedParams.ef as EfParam<string> | undefined));

    // Dataset-specific params: everything else (excluding the ones we already wrote).
    const reserved = new Set([
      "terms",
      "maxList",
      "count",
      "offset",
      "q",
      "df",
      "sf",
      "cf",
      "ef",
    ]);
    for (const [key, value] of Object.entries(mergedParams)) {
      if (reserved.has(key)) continue;
      if (value === undefined) continue;
      if (value === null) continue;
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        url.searchParams.set(key, String(value));
      } else {
        throw new ClinicalTablesParseError(
          `Unsupported query param value type for "${key}". Use string/number/boolean.`,
        );
      }
    }

    const raw = await this.client.getJson(
      url.pathname,
      Object.fromEntries(url.searchParams),
      options,
    );
    return parseSearchResult(raw) as SearchResult<ExtraDataFromEf<Field, Ef>>;
  }
}

function toQueryPrimitive(value: unknown): string | number | boolean | undefined {
  if (value === undefined) return undefined;
  if (value === null) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value;
  return undefined;
}

function parseSearchResult(raw: unknown): SearchResult<Record<string, unknown[]> | null> {
  if (!Array.isArray(raw)) {
    throw new ClinicalTablesParseError("ClinicalTables response is not an array.");
  }
  if (raw.length < 4 || raw.length > 5) {
    throw new ClinicalTablesParseError(
      `ClinicalTables response must be a 4- or 5-element array. Got length=${raw.length}.`,
    );
  }

  const total = raw[0];
  const codes = raw[1];
  const extra = raw[2];
  const display = raw[3];
  const codeSystems = raw[4];

  if (typeof total !== "number") {
    throw new ClinicalTablesParseError("ClinicalTables response[0] (total) is not a number.");
  }
  if (!Array.isArray(codes) || !codes.every((c) => typeof c === "string")) {
    throw new ClinicalTablesParseError(
      "ClinicalTables response[1] (codes) is not a string array.",
    );
  }

  if (extra !== null) {
    if (!isObject(extra)) {
      throw new ClinicalTablesParseError(
        "ClinicalTables response[2] (extra) is not an object or null.",
      );
    }
    for (const [k, v] of Object.entries(extra)) {
      if (!Array.isArray(v)) {
        throw new ClinicalTablesParseError(
          `ClinicalTables response[2].${k} (extra field) is not an array.`,
        );
      }
    }
  }

  if (!Array.isArray(display) || !display.every((row) => Array.isArray(row))) {
    throw new ClinicalTablesParseError(
      "ClinicalTables response[3] (display) is not an array of arrays.",
    );
  }
  if (
    codeSystems !== undefined &&
    (!Array.isArray(codeSystems) || !codeSystems.every((c) => typeof c === "string"))
  ) {
    throw new ClinicalTablesParseError(
      "ClinicalTables response[4] (codeSystems) is not a string array.",
    );
  }

  const extraObj = extra as Record<string, unknown[]> | null;
  const displayNormalized: string[][] = (display as unknown[][]).map((row) =>
    row.map((cell) => String(cell)),
  );
  const items = codes.map((code, i) => {
    const displayRow = displayNormalized[i] ?? [];
    const extraRow: Record<string, unknown> | null =
      extraObj === null
        ? null
        : Object.fromEntries(Object.entries(extraObj).map(([k, arr]) => [k, arr[i]]));
    return { code, display: displayRow, extra: extraRow };
  });

  const result: SearchResult<Record<string, unknown[]> | null> = {
    total,
    codes,
    extra: extraObj,
    display: displayNormalized,
    items,
    raw,
  };
  if (codeSystems !== undefined) {
    result.codeSystems = codeSystems as string[];
  }
  return result;
}

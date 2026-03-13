export type FetchLike = (
  input: RequestInfo,
  init?: RequestInit,
) => Promise<Response>;

export interface ClinicalTablesHttpClient {
  readonly baseUrl: string;
  readonly defaultSearchParams: DefaultSearchParams;
  getJson(
    path: string,
    query: Record<string, string | undefined>,
    options?: RequestOptions,
  ): Promise<unknown>;
}

export type RequestMiddleware = (ctx: {
  url: URL;
  init: RequestInit;
}) => void | Promise<void>;

export type CsvParam<T extends string> = string | readonly T[];

export type EfSpec<Field extends string, Alias extends string = string> =
  | Field
  | { field: Field; as: Alias };

export type EfParam<Field extends string> = string | readonly EfSpec<Field>[];

export type QueryPrimitive = string | number | boolean;

export type RequestOptions = {
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

export type DefaultSearchParams = Partial<
  Omit<
    SearchParamsBase<string, CsvParam<string> | undefined, EfParam<string> | undefined>,
    "terms"
  >
>;

export type SearchParamsBase<
  Field extends string,
  Df extends CsvParam<Field> | undefined,
  Ef extends EfParam<Field> | undefined,
> = {
  terms: string;
  maxList?: number;
  count?: number;
  offset?: number;
  q?: string;
  df?: Df;
  sf?: CsvParam<Field>;
  cf?: Field | string;
  ef?: Ef;
};

type EfKey<S> = S extends { as: infer A }
  ? A extends string
    ? A
    : never
  : S extends string
    ? S
    : never;

export type ExtraDataFromEf<
  Field extends string,
  Ef extends EfParam<Field> | undefined,
> = Ef extends readonly EfSpec<Field>[]
  ? { [K in EfKey<Ef[number]>]: unknown[] }
  : Ef extends string
    ? Record<string, unknown[]>
    : null;

export type ExtraRow<E> = E extends Record<string, readonly unknown[]>
  ? { [K in keyof E]: E[K][number] }
  : null;

export type SearchItem<E> = {
  code: string;
  display: string[];
  extra: ExtraRow<E>;
};

export type SearchResult<E> = {
  total: number;
  codes: string[];
  extra: E;
  display: string[][];
  codeSystems?: string[];
  items: Array<SearchItem<E>>;
  raw: unknown;
};

import {
  ClinicalTablesFetchNotAvailableError,
  ClinicalTablesHttpError,
  ClinicalTablesParseError,
} from "./errors";
import type {
  ClinicalTablesHttpClient,
  DefaultSearchParams,
  FetchLike,
  RequestMiddleware,
  RequestOptions,
} from "./types";
import { normalizeBaseUrl, isObject } from "./utils/query";
import { ClinicalTablesDatasetClient, type DatasetDefinition } from "./dataset";

export type ClinicalTablesClientConfig = {
  baseUrl: string;
  fetch: FetchLike;
  defaultHeaders: Record<string, string>;
  defaultSearchParams: DefaultSearchParams;
  middlewares: RequestMiddleware[];
};

export class ClinicalTablesClientBuilder {
  private _baseUrl = "https://clinicaltables.nlm.nih.gov/";
  private _fetch: FetchLike | undefined =
    typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : undefined;
  private _defaultHeaders: Record<string, string> = {
    accept: "application/json",
  };
  private _defaultSearchParams: DefaultSearchParams = {};
  private _middlewares: RequestMiddleware[] = [];

  baseUrl(url: string): this {
    this._baseUrl = normalizeBaseUrl(url);
    return this;
  }

  fetch(fetchImpl: FetchLike): this {
    this._fetch = fetchImpl;
    return this;
  }

  headers(headers: Record<string, string>): this {
    this._defaultHeaders = { ...this._defaultHeaders, ...headers };
    return this;
  }

  defaultSearchParams(params: DefaultSearchParams): this {
    this._defaultSearchParams = { ...this._defaultSearchParams, ...params };
    return this;
  }

  use(mw: RequestMiddleware): this {
    this._middlewares.push(mw);
    return this;
  }

  build(): ClinicalTablesClient {
    if (!this._fetch) throw new ClinicalTablesFetchNotAvailableError();
    return new ClinicalTablesClient({
      baseUrl: normalizeBaseUrl(this._baseUrl),
      fetch: this._fetch,
      defaultHeaders: this._defaultHeaders,
      defaultSearchParams: this._defaultSearchParams,
      middlewares: [...this._middlewares],
    });
  }
}

export class ClinicalTablesClient implements ClinicalTablesHttpClient {
  static builder(): ClinicalTablesClientBuilder {
    return new ClinicalTablesClientBuilder();
  }

  private readonly cfg: ClinicalTablesClientConfig;

  constructor(cfg: ClinicalTablesClientConfig) {
    this.cfg = cfg;
  }

  get baseUrl(): string {
    return this.cfg.baseUrl;
  }

  get defaultSearchParams(): DefaultSearchParams {
    return this.cfg.defaultSearchParams;
  }

  dataset<
    Id extends string,
    Version extends string,
    Field extends string,
    ExtraParams extends Record<string, unknown> = {},
  >(def: DatasetDefinition<Id, Version, Field, ExtraParams>): ClinicalTablesDatasetClient<Field, ExtraParams> {
    return new ClinicalTablesDatasetClient<Field, ExtraParams>(this, def);
  }

  async getJson(
    path: string,
    query: Record<string, string | undefined>,
    options?: RequestOptions,
  ): Promise<unknown> {
    const url = new URL(path, this.cfg.baseUrl);
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      url.searchParams.set(k, v);
    }

    const init: RequestInit = {
      method: "GET",
      headers: {
        ...this.cfg.defaultHeaders,
        ...(options?.headers ?? {}),
      },
    };
    if (options?.signal) init.signal = options.signal;

    for (const mw of this.cfg.middlewares) {
      await mw({ url, init });
    }

    let res: Response;
    try {
      res = await this.cfg.fetch(url.toString(), init);
    } catch (err) {
      throw new ClinicalTablesHttpError({
        status: 0,
        statusText: "FETCH_FAILED",
        url: url.toString(),
        bodyText: err instanceof Error ? err.message : String(err),
      });
    }

    if (!res.ok) {
      let bodyText: string | undefined;
      try {
        bodyText = await res.text();
      } catch {
        bodyText = undefined;
      }
      const args: {
        status: number;
        statusText: string;
        url: string;
        bodyText?: string;
      } = {
        status: res.status,
        statusText: res.statusText,
        url: url.toString(),
      };
      if (bodyText !== undefined) args.bodyText = bodyText;
      throw new ClinicalTablesHttpError(args);
    }

    try {
      const json = await res.json();
      return json;
    } catch (err) {
      let bodyText: string | undefined;
      try {
        bodyText = await res.text();
      } catch {
        bodyText = undefined;
      }
      throw new ClinicalTablesParseError(
        `Failed to parse JSON response from ${url.toString()}`,
        { cause: isObject(err) ? err : bodyText },
      );
    }
  }
}

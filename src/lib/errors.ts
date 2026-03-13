export class ClinicalTablesSdkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "ClinicalTablesSdkError";
    if (options?.cause !== undefined) {
      // TS lib typing for Error.cause varies by target/lib.
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

export class ClinicalTablesFetchNotAvailableError extends ClinicalTablesSdkError {
  constructor() {
    super(
      "No fetch implementation available. In Node.js, use Node 18+ or pass a fetch implementation via ClinicalTablesClient.builder().fetch(...).",
    );
    this.name = "ClinicalTablesFetchNotAvailableError";
  }
}

export class ClinicalTablesHttpError extends ClinicalTablesSdkError {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly bodyText: string | undefined;

  constructor(args: {
    status: number;
    statusText: string;
    url: string;
    bodyText?: string;
  }) {
    const msg = `HTTP ${args.status} ${args.statusText} for ${args.url}`;
    super(msg);
    this.name = "ClinicalTablesHttpError";
    this.status = args.status;
    this.statusText = args.statusText;
    this.url = args.url;
    this.bodyText = args.bodyText;
  }
}

export class ClinicalTablesParseError extends ClinicalTablesSdkError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ClinicalTablesParseError";
  }
}

export class CanceledError extends ClinicalTablesSdkError {
  constructor(message = "Canceled") {
    super(message);
    this.name = "CanceledError";
  }
}

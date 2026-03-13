import './App.css'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import {
  CanceledError,
  ClinicalTablesClient,
  ClinicalTablesHttpError,
  ClinicalTablesParseError,
  datasets,
  debounce,
  displayToObjects,
  throttle,
  type DatasetDefinition,
  type EfSpec,
} from 'clinical-table-search-sdk'

type AnyDatasetDef = DatasetDefinition<
  string,
  string,
  string,
  Record<string, unknown>
>

type DatasetEntry = {
  key: string
  label: string
  blurb: string
  def: AnyDatasetDef
}

const DATASET_CATALOG: DatasetEntry[] = [
  {
    key: 'hcpcs',
    label: 'HCPCS (v3)',
    blurb: 'Procedure codes and descriptions.',
    def: datasets.hcpcs as AnyDatasetDef,
  },
  {
    key: 'hpo',
    label: 'HPO (v3)',
    blurb: 'Human Phenotype Ontology terms.',
    def: datasets.hpo as AnyDatasetDef,
  },
  {
    key: 'icd11_codes',
    label: 'ICD-11 Codes (v3)',
    blurb: 'ICD-11 stem and extension codes.',
    def: datasets.icd11_codes as AnyDatasetDef,
  },
  {
    key: 'icd9cm_dx',
    label: 'ICD-9-CM Dx (v3)',
    blurb: 'ICD-9-CM diagnosis codes.',
    def: datasets.icd9cm_dx as AnyDatasetDef,
  },
  {
    key: 'icd9cm_sg',
    label: 'ICD-9-CM Sg (v3)',
    blurb: 'ICD-9-CM procedure codes.',
    def: datasets.icd9cm_sg as AnyDatasetDef,
  },
  {
    key: 'loinc',
    label: 'LOINC Items (v3)',
    blurb: 'LOINC questions, forms, and panels.',
    def: datasets.loinc as AnyDatasetDef,
  },
  {
    key: 'procedures',
    label: 'Procedures (v3)',
    blurb: 'Consumer-friendly procedure names and synonyms.',
    def: datasets.procedures as AnyDatasetDef,
  },
  {
    key: 'conditions',
    label: 'Conditions (v3)',
    blurb: 'Consumer-friendly condition names and synonyms.',
    def: datasets.conditions as AnyDatasetDef,
  },
  {
    key: 'npi_idv',
    label: 'NPI Individual (v3)',
    blurb: 'NPI individual providers.',
    def: datasets.npi_idv as AnyDatasetDef,
  },
  {
    key: 'npi_org',
    label: 'NPI Organization (v3)',
    blurb: 'NPI organizations.',
    def: datasets.npi_org as AnyDatasetDef,
  },
  {
    key: 'rxterms',
    label: 'RxTerms (v3)',
    blurb: 'Drug names and strengths (great for autocomplete).',
    def: datasets.rxterms as AnyDatasetDef,
  },
  {
    key: 'ucum',
    label: 'UCUM (v3)',
    blurb: 'Unified Code for Units of Measure.',
    def: datasets.ucum as AnyDatasetDef,
  },
  {
    key: 'variants',
    label: 'Variants (v4)',
    blurb: 'Genetic variants and annotations.',
    def: datasets.variants as AnyDatasetDef,
  },
  {
    key: 'cosmic',
    label: 'COSMIC (v4)',
    blurb: 'Cancer mutations (COSMIC).',
    def: datasets.cosmic as AnyDatasetDef,
  },
  {
    key: 'cosmic_struct',
    label: 'COSMIC Structural (v3)',
    blurb: 'Structural variants (COSMIC).',
    def: datasets.cosmic_struct as AnyDatasetDef,
  },
  {
    key: 'cytogenetic_locs',
    label: 'Cytogenetic Locs (v3)',
    blurb: 'Cytogenetic location lookups.',
    def: datasets.cytogenetic_locs as AnyDatasetDef,
  },
  {
    key: 'dbvar',
    label: 'dbVar (v3)',
    blurb: 'NCBI dbVar variants.',
    def: datasets.dbvar as AnyDatasetDef,
  },
  {
    key: 'disease_names',
    label: 'Disease Names (v3)',
    blurb: 'Disease name to concept id mapping.',
    def: datasets.disease_names as AnyDatasetDef,
  },
  {
    key: 'genes',
    label: 'Genes (v4)',
    blurb: 'HGNC symbols, names, and aliases.',
    def: datasets.genes as AnyDatasetDef,
  },
  {
    key: 'refseqs',
    label: 'RefSeqs (v3)',
    blurb: 'RefSeq accessions and gene mappings.',
    def: datasets.refseqs as AnyDatasetDef,
  },
  {
    key: 'snps',
    label: 'SNPs (v3)',
    blurb: 'dbSNP rs numbers with GRCh37/38 positions.',
    def: datasets.snps as AnyDatasetDef,
  },
  {
    key: 'star_alleles',
    label: 'Star Alleles (v3)',
    blurb: 'Pharmacogenomics star alleles.',
    def: datasets.star_alleles as AnyDatasetDef,
  },
]

type ParamSpec =
  | {
      kind: 'toggle'
      key: string
      label: string
      help?: string
    }
  | {
      kind: 'select'
      key: string
      label: string
      help?: string
      options: Array<{ label: string; value: string | number }>
    }

const EXTRA_PARAM_SPECS_BY_DATASET_ID: Record<string, ParamSpec[]> = {
  loinc_items: [
    {
      kind: 'toggle',
      key: 'excludeCopyrighted',
      label: 'Exclude copyrighted text',
      help: 'Recommended for public demos; hides copyrighted questions/forms.',
    },
    {
      kind: 'select',
      key: 'type',
      label: 'Item type',
      options: [
        { label: 'Any', value: '' },
        { label: 'Question', value: 'question' },
        { label: 'Form', value: 'form' },
        { label: 'Panel', value: 'panel' },
        { label: 'Form and section', value: 'form_and_section' },
      ],
    },
    {
      kind: 'toggle',
      key: 'available',
      label: 'Available via RetrieveForm',
      help: 'Only return items that can be retrieved via the LOINC RetrieveForm API.',
    },
  ],
  cosmic: [
    {
      kind: 'select',
      key: 'grchv',
      label: 'Genome build (grchv)',
      options: [
        { label: 'GRCh38', value: 38 },
        { label: 'GRCh37', value: 37 },
      ],
    },
  ],
  cosmic_struct: [
    {
      kind: 'select',
      key: 'grchv',
      label: 'Genome build (grchv)',
      options: [
        { label: 'GRCh38', value: 38 },
        { label: 'GRCh37', value: 37 },
      ],
    },
  ],
  icd11_codes: [
    {
      kind: 'select',
      key: 'type',
      label: 'ICD-11 type',
      help: 'When set, limits results to stem codes, extension codes, or categories.',
      options: [
        { label: 'Any', value: '' },
        { label: 'Stem', value: 'stem' },
        { label: 'Extension', value: 'extension' },
        { label: 'Category', value: 'category' },
      ],
    },
  ],
  dbvar: [
    {
      kind: 'select',
      key: 'autocomp',
      label: 'Autocomplete (autocomp)',
      options: [
        { label: 'Default', value: '' },
        { label: 'Off (0)', value: 0 },
        { label: 'On (1)', value: 1 },
      ],
    },
  ],
}

type CustomParamRow = {
  id: string
  key: string
  type: 'string' | 'number' | 'boolean'
  value: string
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function csvParamToArray(v: unknown): string[] {
  if (v === undefined || v === null) return []
  if (Array.isArray(v)) return v.map(String)
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function formatTsString(s: string): string {
  return `'${s.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

function formatTsArray(items: string[]): string {
  if (items.length === 0) return '[] as const'
  return `[${items.map((s) => formatTsString(s)).join(', ')}] as const`
}

function formatEfTs(ef: Array<{ field: string; as?: string }>): string {
  if (ef.length === 0) return 'undefined'
  const parts = ef.map((e) => {
    if (!e.as) return formatTsString(e.field)
    return `{ field: ${formatTsString(e.field)}, as: ${formatTsString(e.as)} }`
  })
  return `[${parts.join(', ')}] as const`
}

function efToCsv(ef: readonly EfSpec<string>[] | undefined): string | undefined {
  if (!ef || ef.length === 0) return undefined
  const parts: string[] = []
  for (const item of ef) {
    if (typeof item === 'string') {
      parts.push(item)
      continue
    }
    parts.push(`${item.field}:${item.as}`)
  }
  return parts.join(',')
}

function buildRequestUrl(args: {
  baseUrl: string
  def: AnyDatasetDef
  terms: string
  maxList?: number
  count?: number
  offset?: number
  q?: string
  df?: string[]
  sf?: string[]
  cf?: string
  ef?: Array<{ field: string; as?: string }>
  extraParams?: Record<string, string | number | boolean>
}): string {
  try {
    const url = new URL(
      `/api/${args.def.id}/${args.def.version}/search`,
      args.baseUrl,
    )
    url.searchParams.set('terms', args.terms)
    if (args.maxList !== undefined) url.searchParams.set('maxList', String(args.maxList))
    if (args.count !== undefined) url.searchParams.set('count', String(args.count))
    if (args.offset !== undefined) url.searchParams.set('offset', String(args.offset))
    if (args.q) url.searchParams.set('q', args.q)
    if (args.df && args.df.length) url.searchParams.set('df', args.df.join(','))
    if (args.sf && args.sf.length) url.searchParams.set('sf', args.sf.join(','))
    if (args.cf) url.searchParams.set('cf', args.cf)
    if (args.ef && args.ef.length) {
      const spec: EfSpec<string>[] = args.ef.map((e) =>
        e.as ? ({ field: e.field, as: e.as } as const) : e.field,
      )
      const csv = efToCsv(spec)
      if (csv) url.searchParams.set('ef', csv)
    }
    if (args.extraParams) {
      for (const [k, v] of Object.entries(args.extraParams)) {
        url.searchParams.set(k, String(v))
      }
    }
    return url.toString()
  } catch {
    return '(invalid base URL)'
  }
}

function errorToSummary(err: unknown): { title: string; detail?: string } {
  if (err instanceof CanceledError) return { title: err.message }
  if (err instanceof ClinicalTablesParseError) return { title: err.message }
  if (err instanceof ClinicalTablesHttpError) {
    const detail = err.bodyText ? err.bodyText.slice(0, 240) : undefined
    return { title: `HTTP ${err.status} ${err.statusText}`, detail }
  }
  if (err instanceof Error) return { title: err.message }
  return { title: String(err) }
}

function CodeBlock(props: { title?: string; code: string; actions?: ReactNode }) {
  return (
    <div className="codeBlock">
      {(props.title || props.actions) && (
        <div className="codeHeader">
          <div className="codeTitle">{props.title}</div>
          <div className="codeActions">{props.actions}</div>
        </div>
      )}
      <pre>
        <code>{props.code}</code>
      </pre>
    </div>
  )
}

function SmallButton(
  props: ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: 'default' | 'danger'
  },
) {
  const tone = props.tone ?? 'default'
  return (
    <button {...props} className={`smallBtn ${tone} ${props.className ?? ''}`.trim()} />
  )
}

function FieldMultiSelect(props: {
  label: string
  hint?: string
  fields: string[]
  selected: string[]
  onChange: (next: string[]) => void
  sortable?: boolean
}) {
  const [filter, setFilter] = useState('')
  const f = filter.trim().toLowerCase()
  const matches = useMemo(() => {
    const list = f
      ? props.fields.filter((x) => x.toLowerCase().includes(f))
      : props.fields
    return list.slice(0, 80)
  }, [f, props.fields])

  const toggle = (field: string) => {
    if (props.selected.includes(field)) {
      props.onChange(props.selected.filter((x) => x !== field))
      return
    }
    props.onChange([...props.selected, field])
  }

  const move = (idx: number, delta: number) => {
    const next = [...props.selected]
    const j = idx + delta
    if (j < 0 || j >= next.length) return
    const tmp = next[idx]
    next[idx] = next[j]!
    next[j] = tmp!
    props.onChange(next)
  }

  return (
    <div className="fieldMulti">
      <div className="labelRow">
        <div className="label">{props.label}</div>
        <div className="muted small">
          {props.selected.length} selected{props.hint ? ` · ${props.hint}` : ''}
        </div>
      </div>

      <div className="chipRow">
        {props.selected.length === 0 ? (
          <div className="muted small">None</div>
        ) : (
          props.selected.map((field, idx) => (
            <div key={field} className="chip">
              <span className="chipText">{field}</span>
              {props.sortable && (
                <div className="chipBtns">
                  <SmallButton
                    type="button"
                    onClick={() => move(idx, -1)}
                    title="Move up"
                    aria-label={`Move ${field} up`}
                  >
                    ↑
                  </SmallButton>
                  <SmallButton
                    type="button"
                    onClick={() => move(idx, 1)}
                    title="Move down"
                    aria-label={`Move ${field} down`}
                  >
                    ↓
                  </SmallButton>
                </div>
              )}
              <SmallButton
                type="button"
                onClick={() => toggle(field)}
                tone="danger"
                title="Remove"
                aria-label={`Remove ${field}`}
              >
                ×
              </SmallButton>
            </div>
          ))
        )}
      </div>

      <input
        className="input"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter fields…"
        aria-label={`${props.label} field filter`}
      />
      <div className="fieldList" role="listbox" aria-label={`${props.label} fields`}>
        {matches.map((field) => {
          const active = props.selected.includes(field)
          return (
            <button
              key={field}
              type="button"
              className={`fieldItem ${active ? 'active' : ''}`}
              onClick={() => toggle(field)}
            >
              <span className="fieldDot" aria-hidden="true" />
              <span className="fieldName">{field}</span>
              <span className="fieldState">{active ? 'Selected' : 'Add'}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ExtraFieldsEditor(props: {
  fields: string[]
  ef: Array<{ field: string; as?: string }>
  onChange: (next: Array<{ field: string; as?: string }>) => void
}) {
  const [filter, setFilter] = useState('')
  const f = filter.trim().toLowerCase()
  const matches = useMemo(() => {
    const list = f
      ? props.fields.filter((x) => x.toLowerCase().includes(f))
      : props.fields
    return list.slice(0, 80)
  }, [f, props.fields])

  const add = (field: string) => {
    if (props.ef.some((x) => x.field === field)) return
    props.onChange([...props.ef, { field }])
  }

  const remove = (field: string) => {
    props.onChange(props.ef.filter((x) => x.field !== field))
  }

  const setAlias = (field: string, as: string) => {
    props.onChange(
      props.ef.map((x) => (x.field === field ? { ...x, as: as.trim() || undefined } : x)),
    )
  }

  return (
    <div className="fieldMulti">
      <div className="labelRow">
        <div className="label">Extra fields (ef)</div>
        <div className="muted small">{props.ef.length} selected</div>
      </div>

      <div className="efList">
        {props.ef.length === 0 ? (
          <div className="muted small">None</div>
        ) : (
          props.ef.map((e) => (
            <div key={e.field} className="efRow">
              <div className="efField">{e.field}</div>
              <input
                className="input efAlias"
                value={e.as ?? ''}
                onChange={(ev) => setAlias(e.field, ev.target.value)}
                placeholder="alias (optional)"
                aria-label={`Alias for ${e.field}`}
              />
              <SmallButton
                type="button"
                onClick={() => remove(e.field)}
                tone="danger"
                aria-label={`Remove extra field ${e.field}`}
              >
                ×
              </SmallButton>
            </div>
          ))
        )}
      </div>

      <input
        className="input"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter fields to add…"
        aria-label="Extra fields filter"
      />
      <div className="fieldList" role="listbox" aria-label="Extra fields">
        {matches.map((field) => {
          const active = props.ef.some((x) => x.field === field)
          return (
            <button
              key={field}
              type="button"
              className={`fieldItem ${active ? 'active' : ''}`}
              onClick={() => (active ? remove(field) : add(field))}
            >
              <span className="fieldDot" aria-hidden="true" />
              <span className="fieldName">{field}</span>
              <span className="fieldState">{active ? 'Selected' : 'Add'}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function App() {
  const [baseUrl, setBaseUrl] = useState('https://clinicaltables.nlm.nih.gov/')
  const [datasetKey, setDatasetKey] = useState('rxterms')

  const datasetEntry = useMemo(() => {
    return DATASET_CATALOG.find((d) => d.key === datasetKey) ?? DATASET_CATALOG[0]!
  }, [datasetKey])

  const fields = useMemo(() => [...datasetEntry.def.fields].map(String), [datasetEntry.def.fields])

  const [terms, setTerms] = useState('amoxicillin')
  const [maxListStr, setMaxListStr] = useState('15')
  const [offsetStr, setOffsetStr] = useState('')
  const [countStr, setCountStr] = useState('')
  const [q, setQ] = useState('')
  const [cf, setCf] = useState('')

  const [df, setDf] = useState<string[]>(() =>
    csvParamToArray((datasets.rxterms as AnyDatasetDef).defaults?.df),
  )
  const [sf, setSf] = useState<string[]>(() =>
    csvParamToArray((datasets.rxterms as AnyDatasetDef).defaults?.sf),
  )
  const [ef, setEf] = useState<Array<{ field: string; as?: string }>>([])

  const [extraParams, setExtraParams] = useState<Record<string, string | number | boolean>>({})
  const [customParams, setCustomParams] = useState<CustomParamRow[]>([])

  const [logRequests, setLogRequests] = useState(true)
  const [requestLog, setRequestLog] = useState<Array<{ at: number; url: string }>>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ title: string; detail?: string } | null>(null)
  const [result, setResult] = useState<any>(null)
  const [resultView, setResultView] = useState<'table' | 'json' | 'items'>('table')

  const abortRef = useRef<AbortController | null>(null)

  const extraSpecs = useMemo(() => {
    return EXTRA_PARAM_SPECS_BY_DATASET_ID[datasetEntry.def.id] ?? []
  }, [datasetEntry.def.id])

  useEffect(() => {
    const defaults = (datasetEntry.def.defaults ?? {}) as Record<string, unknown>
    const nextDf = csvParamToArray(defaults.df)
    const nextSf = csvParamToArray(defaults.sf)

    setDf(nextDf.length ? nextDf : fields.slice(0, Math.min(3, fields.length)))
    setSf(nextSf)
    setEf([])

    const nextExtra: Record<string, string | number | boolean> = {}
    for (const spec of extraSpecs) {
      const v = defaults[spec.key]
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        nextExtra[spec.key] = v
      }
    }
    setExtraParams(nextExtra)
    setCustomParams([])

    // Friendly sample queries per dataset.
    const sampleTerms: Record<string, string> = {
      hcpcs: 'wheelchair',
      hpo: 'seizure',
      icd11_codes: 'diabetes',
      icd9cm_dx: 'asthma',
      icd9cm_sg: 'appendectomy',
      loinc_items: 'hemoglobin',
      procedures: 'knee',
      conditions: 'hypertension',
      npi_idv: 'smith',
      npi_org: 'clinic',
      rxterms: 'amoxicillin',
      ucum: 'mg',
      variants: 'BRCA1',
      cosmic: 'BRAF',
      cosmic_struct: 'ALK',
      cytogenetic_locs: '1p',
      dbvar: 'deletion',
      disease_names: 'breast cancer',
      genes: 'BRCA',
      refseqs: 'NM_',
      snps: 'rs1',
      star_alleles: '*2',
    }
    setTerms(sampleTerms[datasetEntry.def.id] ?? 'test')
    setResult(null)
    setError(null)
    setResultView('table')
  }, [datasetEntry.def, extraSpecs, fields])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const client = useMemo(() => {
    const b = ClinicalTablesClient.builder().baseUrl(baseUrl)
    if (logRequests) {
      b.use(({ url }) => {
        setRequestLog((prev) => [{ at: Date.now(), url: url.toString() }, ...prev].slice(0, 16))
      })
    }
    return b.build()
  }, [baseUrl, logRequests])

  const datasetClient = useMemo(() => {
    return client.dataset(datasetEntry.def as any)
  }, [client, datasetEntry.def])

  const maxList = useMemo(() => {
    const n = Number(maxListStr)
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined
  }, [maxListStr])

  const offset = useMemo(() => {
    const s = offsetStr.trim()
    if (!s) return undefined
    const n = Number(s)
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined
  }, [offsetStr])

  const count = useMemo(() => {
    const s = countStr.trim()
    if (!s) return undefined
    const n = Number(s)
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined
  }, [countStr])

  const resolvedCustomParams = useMemo(() => {
    const out: Record<string, string | number | boolean> = {}
    for (const row of customParams) {
      const k = row.key.trim()
      if (!k) continue
      const raw = row.value.trim()
      if (!raw) continue
      if (row.type === 'number') {
        const n = Number(raw)
        if (!Number.isFinite(n)) continue
        out[k] = n
        continue
      }
      if (row.type === 'boolean') {
        if (raw === 'true' || raw === '1') out[k] = true
        else if (raw === 'false' || raw === '0') out[k] = false
        else continue
        continue
      }
      out[k] = raw
    }
    return out
  }, [customParams])

  const requestUrl = useMemo(() => {
    const extra: Record<string, string | number | boolean> = {
      ...extraParams,
      ...resolvedCustomParams,
    }
    // For select specs we use "" as "Any"; omit when empty.
    for (const [k, v] of Object.entries(extra)) {
      if (v === '') delete extra[k]
    }
    return buildRequestUrl({
      baseUrl,
      def: datasetEntry.def,
      terms: terms || '…',
      maxList,
      count,
      offset,
      q: q.trim() || undefined,
      df,
      sf,
      cf: cf.trim() || undefined,
      ef,
      extraParams: Object.keys(extra).length ? extra : undefined,
    })
  }, [
    baseUrl,
    cf,
    count,
    datasetEntry.def,
    df,
    ef,
    extraParams,
    maxList,
    offset,
    q,
    resolvedCustomParams,
    sf,
    terms,
  ])

  const baseOrigin = useMemo(() => {
    try {
      return new URL(baseUrl).origin
    } catch {
      return '(invalid base URL)'
    }
  }, [baseUrl])

  const generatedCode = useMemo(() => {
    const extra: Record<string, string | number | boolean> = {
      ...extraParams,
      ...resolvedCustomParams,
    }
    for (const [k, v] of Object.entries(extra)) {
      if (v === '') delete extra[k]
    }

    const lines: string[] = []
    lines.push(`import { ClinicalTablesClient, datasets, displayToObjects } from 'clinical-table-search-sdk'`)
    lines.push('')
    lines.push(`const client = ClinicalTablesClient.builder()`)
    lines.push(`  .baseUrl(${formatTsString(baseUrl)})`)
    lines.push(`  .build()`)
    lines.push('')
    lines.push(`const api = client.dataset(datasets.${datasetEntry.key})`)
    lines.push('')
    lines.push(`const df = ${formatTsArray(df)}`)
    lines.push('')
    lines.push(`const res = await api.search({`)
    lines.push(`  terms: ${formatTsString(terms)},`)
    if (maxList !== undefined) lines.push(`  maxList: ${maxList},`)
    if (count !== undefined) lines.push(`  count: ${count},`)
    if (offset !== undefined) lines.push(`  offset: ${offset},`)
    if (q.trim()) lines.push(`  q: ${formatTsString(q.trim())},`)
    if (df.length) lines.push(`  df,`)
    if (sf.length) lines.push(`  sf: ${formatTsArray(sf)},`)
    if (cf.trim()) lines.push(`  cf: ${formatTsString(cf.trim())},`)
    if (ef.length) lines.push(`  ef: ${formatEfTs(ef)},`)
    for (const [k, v] of Object.entries(extra)) {
      if (typeof v === 'string') lines.push(`  ${k}: ${formatTsString(v)},`)
      else lines.push(`  ${k}: ${String(v)},`)
    }
    lines.push(`})`)
    lines.push('')
    lines.push(`const rows = displayToObjects(df, res.display)`)
    return lines.join('\n')
  }, [baseUrl, cf, count, datasetEntry.key, df, ef, extraParams, maxList, offset, q, resolvedCustomParams, sf, terms])

  const runSearch = async () => {
    const trimmed = terms.trim()
    if (!trimmed) {
      setError({ title: 'Missing required param: terms' })
      return
    }

    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    const extra: Record<string, string | number | boolean> = {
      ...extraParams,
      ...resolvedCustomParams,
    }
    for (const [k, v] of Object.entries(extra)) {
      if (v === '') delete extra[k]
    }

    setLoading(true)
    setError(null)
    try {
      const res = await datasetClient.search(
        {
          terms: trimmed,
          maxList,
          count,
          offset,
          q: q.trim() || undefined,
          df: df.length ? (df as any) : undefined,
          sf: sf.length ? (sf as any) : undefined,
          cf: cf.trim() || undefined,
          ef: ef.length
            ? (ef.map((e) => (e.as ? ({ field: e.field, as: e.as } as const) : e.field)) as any)
            : undefined,
          ...(extra as any),
        },
        { signal: ac.signal },
      )
      setResult(res)
      setResultView('table')
    } catch (err) {
      // Aborted fetches can surface as HTTP status=0 errors; treat as cancellation noise in the UI.
      if (err instanceof ClinicalTablesHttpError && err.status === 0) return
      setError(errorToSummary(err))
    } finally {
      setLoading(false)
    }
  }

  const cancel = () => {
    abortRef.current?.abort()
    abortRef.current = null
  }

  const rows = useMemo(() => {
    if (!result || !Array.isArray(result.display)) return []
    try {
      const objects = displayToObjects(df as any, result.display as string[][])
      const extraKeys = ef
        .map((e) => e.as ?? e.field)
        .filter((k, i, arr) => arr.indexOf(k) === i)
      return objects.map((obj, i) => {
        const item = result.items?.[i]
        const extraRow: Record<string, string> = {}
        for (const k of extraKeys) {
          const v = item?.extra?.[k]
          extraRow[k] = v === undefined ? '' : typeof v === 'string' ? v : JSON.stringify(v)
        }
        return { ...obj, ...extraRow }
      })
    } catch {
      return []
    }
  }, [df, ef, result])

  const columns = useMemo(() => {
    const extraKeys = ef
      .map((e) => e.as ?? e.field)
      .filter((k, i, arr) => arr.indexOf(k) === i)
    return [...df, ...extraKeys]
  }, [df, ef])

  return (
    <>
      <div className="app">
        <header className="hero">
          <div className="heroCopy">
            <div className="pill">
              Type-safe browser + Node client for{' '}
              <a
                href="https://clinicaltables.nlm.nih.gov/"
                target="_blank"
                rel="noreferrer"
              >
                NLM ClinicalTables
              </a>
            </div>
            <h1>Clinical Tables Search SDK</h1>
            <p className="lead">
              Builder-pattern client, dataset definitions, and composable
              utilities (debounce/throttle) to ship autocomplete, tables, and
              search UIs quickly.
            </p>

            <div className="heroBtns">
              <a className="btn primary" href="#playground">
                Open API Builder
              </a>
              <a className="btn" href="#autocomplete">
                Autocomplete demo
              </a>
              <a className="btn" href="#catalog">
                Dataset catalog
              </a>
            </div>

            <div className="heroMeta">
              <div className="metaRow">
                <span className="metaKey">Base URL</span>
                <span className="metaVal">{baseUrl}</span>
              </div>
              <div className="metaRow">
                <span className="metaKey">CORS</span>
                <span className="metaVal">Allowed (browser-friendly)</span>
              </div>
            </div>
          </div>
          <div className="heroCode">
            <CodeBlock
              title="Quickstart"
              code={[
                `import { ClinicalTablesClient, datasets } from 'clinical-table-search-sdk'`,
                ``,
                `const client = ClinicalTablesClient.builder()`,
                `  .baseUrl('https://clinicaltables.nlm.nih.gov/')`,
                `  .build()`,
                ``,
                `const rxterms = client.dataset(datasets.rxterms)`,
                `const res = await rxterms.search({`,
                `  terms: 'amoxicillin',`,
                `  maxList: 10,`,
                `})`,
              ].join('\n')}
              actions={
                <SmallButton
                  type="button"
                  onClick={() => void navigator.clipboard?.writeText(generatedCode)}
                  title="Copy current generated code"
                >
                  Copy builder code
                </SmallButton>
              }
            />
          </div>
        </header>

        <main className="main">
          <section id="playground" className="section">
            <div className="sectionHeader">
              <h2>API Builder</h2>
              <p>
                Pick a dataset, configure query params, fetch results, and
                inspect table output and raw JSON.
              </p>
            </div>

            <div className="playground">
              <div className="panel">
                <div className="panelHeader">
                  <h3>Request</h3>
                  <div className="panelHeaderRight">
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={logRequests}
                        onChange={(e) => setLogRequests(e.target.checked)}
                      />
                      <span>Log requests</span>
                    </label>
                  </div>
                </div>

                <div className="group">
                  <label className="label" htmlFor="baseUrl">
                    Base URL
                  </label>
                  <input
                    id="baseUrl"
                    className="input"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://clinicaltables.nlm.nih.gov/"
                  />
                  <div className="muted small">
                    Defaults to the live ClinicalTables API.
                  </div>
                </div>

                <div className="group">
                  <label className="label" htmlFor="dataset">
                    Dataset
                  </label>
                  <div className="row">
                    <select
                      id="dataset"
                      className="input"
                      value={datasetKey}
                      onChange={(e) => setDatasetKey(e.target.value)}
                    >
                      {DATASET_CATALOG.map((d) => (
                        <option key={d.key} value={d.key}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    <a
                      className="btn mini"
                      href={datasetEntry.def.docUrl ?? 'https://clinicaltables.nlm.nih.gov/'}
                      target="_blank"
                      rel="noreferrer"
                      title="Open dataset API docs"
                    >
                      Docs
                    </a>
                  </div>
                  <div className="muted small">
                    {datasetEntry.def.id}/{datasetEntry.def.version} ·{' '}
                    {datasetEntry.blurb}
                  </div>
                </div>

                <div className="group">
                  <label className="label" htmlFor="terms">
                    terms (required)
                  </label>
                  <input
                    id="terms"
                    className="input"
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Search terms…"
                  />
                </div>

                <div className="row3">
                  <div className="group">
                    <label className="label" htmlFor="maxList">
                      maxList
                    </label>
                    <input
                      id="maxList"
                      className="input"
                      inputMode="numeric"
                      value={maxListStr}
                      onChange={(e) => setMaxListStr(e.target.value)}
                      placeholder="15"
                    />
                  </div>
                  <div className="group">
                    <label className="label" htmlFor="offset">
                      offset
                    </label>
                    <input
                      id="offset"
                      className="input"
                      inputMode="numeric"
                      value={offsetStr}
                      onChange={(e) => setOffsetStr(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="group">
                    <label className="label" htmlFor="count">
                      count
                    </label>
                    <input
                      id="count"
                      className="input"
                      inputMode="numeric"
                      value={countStr}
                      onChange={(e) => setCountStr(e.target.value)}
                      placeholder="(optional)"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="label" htmlFor="q">
                    q (advanced)
                  </label>
                  <input
                    id="q"
                    className="input"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="(optional)"
                  />
                </div>

                <div className="group">
                  <label className="label" htmlFor="cf">
                    cf (optional)
                  </label>
                  <input
                    id="cf"
                    className="input"
                    value={cf}
                    onChange={(e) => setCf(e.target.value)}
                    placeholder="(optional)"
                  />
                </div>

                <FieldMultiSelect
                  label="Display fields (df)"
                  hint="Controls table columns"
                  fields={fields}
                  selected={df}
                  onChange={setDf}
                  sortable
                />

                <FieldMultiSelect
                  label="Search fields (sf)"
                  hint="Optional"
                  fields={fields}
                  selected={sf}
                  onChange={setSf}
                />

                <ExtraFieldsEditor fields={fields} ef={ef} onChange={setEf} />

                {extraSpecs.length > 0 && (
                  <div className="group">
                    <div className="labelRow">
                      <div className="label">Dataset params</div>
                      <div className="muted small">Typed extras for this dataset</div>
                    </div>
                    <div className="extraGrid">
                      {extraSpecs.map((spec) => {
                        const val = extraParams[spec.key]
                        if (spec.kind === 'toggle') {
                          return (
                            <label key={spec.key} className="toggleCard">
                              <div className="toggleCardTop">
                                <input
                                  type="checkbox"
                                  checked={Boolean(val)}
                                  onChange={(e) =>
                                    setExtraParams((p) => ({
                                      ...p,
                                      [spec.key]: e.target.checked,
                                    }))
                                  }
                                />
                                <div className="toggleCardLabel">{spec.label}</div>
                              </div>
                              {spec.help && <div className="muted small">{spec.help}</div>}
                            </label>
                          )
                        }
                        return (
                          <div key={spec.key} className="group tight">
                            <label className="label" htmlFor={`extra-${spec.key}`}>
                              {spec.label}
                            </label>
                            <select
                              id={`extra-${spec.key}`}
                              className="input"
                              value={val === undefined ? '' : String(val)}
                              onChange={(e) => {
                                const raw = e.target.value
                                const opt = spec.options.find((o) => String(o.value) === raw)
                                setExtraParams((p) => {
                                  const next = { ...p }
                                  if (!raw) delete next[spec.key]
                                  else next[spec.key] = (opt?.value ?? raw) as any
                                  return next
                                })
                              }}
                            >
                              {spec.options.map((o) => (
                                <option key={String(o.value)} value={String(o.value)}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                            {spec.help && <div className="muted small">{spec.help}</div>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="group">
                  <div className="labelRow">
                    <div className="label">Custom query params</div>
                    <div className="muted small">
                      Sent as plain query params (string/number/boolean)
                    </div>
                  </div>

                  <div className="customParams">
                    {customParams.length === 0 ? (
                      <div className="muted small">None</div>
                    ) : (
                      customParams.map((row) => (
                        <div key={row.id} className="customRow">
                          <input
                            className="input"
                            value={row.key}
                            onChange={(e) =>
                              setCustomParams((p) =>
                                p.map((x) =>
                                  x.id === row.id ? { ...x, key: e.target.value } : x,
                                ),
                              )
                            }
                            placeholder="param"
                            aria-label="Custom param key"
                          />
                          <select
                            className="input"
                            value={row.type}
                            onChange={(e) =>
                              setCustomParams((p) =>
                                p.map((x) =>
                                  x.id === row.id
                                    ? { ...x, type: e.target.value as any }
                                    : x,
                                ),
                              )
                            }
                            aria-label="Custom param type"
                          >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                          </select>
                          <input
                            className="input"
                            value={row.value}
                            onChange={(e) =>
                              setCustomParams((p) =>
                                p.map((x) =>
                                  x.id === row.id ? { ...x, value: e.target.value } : x,
                                ),
                              )
                            }
                            placeholder="value"
                            aria-label="Custom param value"
                          />
                          <SmallButton
                            type="button"
                            tone="danger"
                            onClick={() => setCustomParams((p) => p.filter((x) => x.id !== row.id))}
                            aria-label="Remove custom param"
                          >
                            ×
                          </SmallButton>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="row">
                    <button
                      type="button"
                      className="btn mini"
                      onClick={() =>
                        setCustomParams((p) => [
                          ...p,
                          { id: uid(), key: '', type: 'string', value: '' },
                        ])
                      }
                    >
                      Add param
                    </button>
                    <div className="muted small">
                      Tip: use dataset docs for supported params.
                    </div>
                  </div>
                </div>

                <div className="group">
                  <div className="row">
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => void runSearch()}
                      disabled={loading || !terms.trim()}
                    >
                      {loading ? 'Searching…' : 'Run search'}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={cancel}
                      disabled={!loading}
                    >
                      Cancel
                    </button>
                  </div>
                <div className="muted small">
                  Uses base URL{' '}
                    <span className="mono">{baseOrigin}</span>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panelHeader">
                  <h3>Response</h3>
                  <div className="panelHeaderRight">
                    <div className="seg">
                      <button
                        type="button"
                        className={`segBtn ${resultView === 'table' ? 'active' : ''}`}
                        onClick={() => setResultView('table')}
                      >
                        Table
                      </button>
                      <button
                        type="button"
                        className={`segBtn ${resultView === 'items' ? 'active' : ''}`}
                        onClick={() => setResultView('items')}
                      >
                        Items
                      </button>
                      <button
                        type="button"
                        className={`segBtn ${resultView === 'json' ? 'active' : ''}`}
                        onClick={() => setResultView('json')}
                      >
                        Raw JSON
                      </button>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <div className="labelRow">
                    <div className="label">Request URL</div>
                    <div className="row">
                      <SmallButton
                        type="button"
                        onClick={() => void navigator.clipboard?.writeText(requestUrl)}
                      >
                        Copy
                      </SmallButton>
                      <a className="btn mini" href={requestUrl} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </div>
                  </div>
                  <div className="mono tiny urlBox">{requestUrl}</div>
                </div>

                <CodeBlock
                  title="Generated TypeScript"
                  code={generatedCode}
                  actions={
                    <SmallButton
                      type="button"
                      onClick={() => void navigator.clipboard?.writeText(generatedCode)}
                    >
                      Copy
                    </SmallButton>
                  }
                />

                {error && (
                  <div className="callout danger">
                    <div className="calloutTitle">{error.title}</div>
                    {error.detail && <div className="muted small">{error.detail}</div>}
                  </div>
                )}

                {!error && !result && (
                  <div className="empty">
                    <div className="emptyTitle">No results yet</div>
                    <div className="muted small">
                      Run a search to see a table and the raw API response.
                    </div>
                  </div>
                )}

                {result && (
                  <>
                    <div className="stats">
                      <div className="stat">
                        <div className="statKey">Total</div>
                        <div className="statVal">{String(result.total ?? '—')}</div>
                      </div>
                      <div className="stat">
                        <div className="statKey">Returned</div>
                        <div className="statVal">{String(result.items?.length ?? '—')}</div>
                      </div>
                      <div className="stat">
                        <div className="statKey">Columns</div>
                        <div className="statVal">{columns.length}</div>
                      </div>
                    </div>

                    {resultView === 'table' && (
                      <div className="tableWrap" aria-label="Results table">
                        <table className="table">
                          <thead>
                            <tr>
                              {columns.map((c) => (
                                <th key={c}>
                                  <span className="mono">{c}</span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.slice(0, 50).map((r: any, idx: number) => (
                              <tr key={idx}>
                                {columns.map((c) => (
                                  <td key={c}>{r[c] ?? ''}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {rows.length > 50 && (
                          <div className="muted small">
                            Showing first 50 rows. Increase{' '}
                            <span className="mono">maxList</span> to fetch more.
                          </div>
                        )}
                      </div>
                    )}

                    {resultView === 'items' && (
                      <CodeBlock
                        code={JSON.stringify(
                          (result.items ?? []).slice(0, 30),
                          null,
                          2,
                        )}
                        actions={
                          <SmallButton
                            type="button"
                            onClick={() =>
                              void navigator.clipboard?.writeText(
                                JSON.stringify(result.items ?? [], null, 2),
                              )
                            }
                          >
                            Copy items
                          </SmallButton>
                        }
                      />
                    )}

                    {resultView === 'json' && (
                      <CodeBlock
                        code={JSON.stringify(result.raw ?? result, null, 2)}
                        actions={
                          <SmallButton
                            type="button"
                            onClick={() =>
                              void navigator.clipboard?.writeText(
                                JSON.stringify(result.raw ?? result, null, 2),
                              )
                            }
                          >
                            Copy JSON
                          </SmallButton>
                        }
                      />
                    )}
                  </>
                )}

                {logRequests && requestLog.length > 0 && (
                  <div className="group">
                    <div className="labelRow">
                      <div className="label">Request log</div>
                      <SmallButton type="button" onClick={() => setRequestLog([])}>
                        Clear
                      </SmallButton>
                    </div>
                    <div className="log">
                      {requestLog.map((x) => (
                        <div key={`${x.at}-${x.url}`} className="logRow">
                          <span className="mono tiny">{new Date(x.at).toLocaleTimeString()}</span>
                          <span className="mono tiny">{x.url}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section id="autocomplete" className="section">
            <div className="sectionHeader">
              <h2>Autocomplete (debounce/throttle)</h2>
              <p>
                This demo calls the live API from the browser and uses the SDK’s{' '}
                <span className="mono">debounce</span> and{' '}
                <span className="mono">throttle</span> utilities.
              </p>
            </div>

            <AutocompleteDemo baseUrl={baseUrl} />
          </section>

          <section id="catalog" className="section">
            <div className="sectionHeader">
              <h2>Dataset catalog</h2>
              <p>
                All supported ClinicalTables datasets (v3/v4). Click “Try” to
                load a dataset into the builder.
              </p>
            </div>

            <div className="catalog">
              {DATASET_CATALOG.map((d) => (
                <div key={d.key} className="card">
                  <div className="cardTop">
                    <div className="cardTitle">{d.label}</div>
                    <div className="cardPills">
                      <span className="pill mini">
                        {d.def.id}/{d.def.version}
                      </span>
                      <a
                        className="pill mini link"
                        href={d.def.docUrl ?? 'https://clinicaltables.nlm.nih.gov/'}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Docs
                      </a>
                    </div>
                  </div>
                  <div className="muted small">{d.blurb}</div>
                  <div className="muted tiny">
                    Fields: <span className="mono">{d.def.fields.length}</span> ·
                    Default df:{' '}
                    <span className="mono">
                      {csvParamToArray((d.def.defaults as any)?.df).join(', ') || '—'}
                    </span>
                  </div>
                  <div className="row">
                    <button
                      type="button"
                      className="btn mini"
                      onClick={() => {
                        setDatasetKey(d.key)
                        window.location.hash = '#playground'
                      }}
                    >
                      Try
                    </button>
                    <a
                      className="btn mini"
                      href={buildRequestUrl({
                        baseUrl,
                        def: d.def,
                        terms: 'test',
                        maxList: 5,
                        df: csvParamToArray((d.def.defaults as any)?.df),
                      })}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Sample request
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="footer">
          <div className="footerInner">
            <div className="muted small">
              Powered by the live{' '}
              <a
                href="https://clinicaltables.nlm.nih.gov/"
                target="_blank"
                rel="noreferrer"
              >
                clinicaltables.nlm.nih.gov
              </a>{' '}
              API.
            </div>
            <div className="muted small">
              SDK utilities: <span className="mono">ClinicalTablesClient</span>,{' '}
              <span className="mono">datasets</span>,{' '}
              <span className="mono">displayToObjects</span>,{' '}
              <span className="mono">debounce</span>,{' '}
              <span className="mono">throttle</span>.
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

export default App

function AutocompleteDemo(props: { baseUrl: string }) {
  const [mode, setMode] = useState<'debounce' | 'throttle'>('debounce')
  const [waitMsStr, setWaitMsStr] = useState('250')
  const [terms, setTerms] = useState('amox')
  const [pending, setPending] = useState(false)
  const [calls, setCalls] = useState(0)
  const [err, setErr] = useState<string | null>(null)
  const [items, setItems] = useState<Array<{ code: string; display: string[] }>>([])

  const waitMs = useMemo(() => {
    const n = Number(waitMsStr)
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 250
  }, [waitMsStr])

  const client = useMemo(() => {
    return ClinicalTablesClient.builder().baseUrl(props.baseUrl).build()
  }, [props.baseUrl])
  const api = useMemo(() => client.dataset(datasets.rxterms as any), [client])

  const acRef = useRef<AbortController | null>(null)

  const rateLimited = useMemo(() => {
    const run = async (t: string) => {
      const trimmed = t.trim()
      if (!trimmed) return []
      acRef.current?.abort()
      const ac = new AbortController()
      acRef.current = ac

      setCalls((c) => c + 1)
      const res = await api.search(
        {
          terms: trimmed,
          maxList: 8,
          df: ['DISPLAY_NAME', 'STRENGTHS_AND_FORMS'] as const,
        } as any,
        { signal: ac.signal },
      )
      return (res.items ?? []) as Array<{ code: string; display: string[] }>
    }

    return mode === 'debounce'
      ? debounce(run, waitMs, { leading: false, trailing: true })
      : throttle(run, waitMs, { leading: true, trailing: true })
  }, [api, mode, waitMs])

  useEffect(() => {
    return () => {
      rateLimited.cancel()
      acRef.current?.abort()
    }
  }, [rateLimited])

  useEffect(() => {
    setErr(null)
    setPending(true)
    void rateLimited(terms)
      .then((next) => {
        setItems(next)
      })
      .catch((e) => {
        // Ignore superseded calls; show real errors only.
        if (e instanceof CanceledError) return
        if (e instanceof ClinicalTablesHttpError && e.status === 0) return
        setErr(errorToSummary(e).title)
      })
      .finally(() => setPending(rateLimited.pending()))
  }, [rateLimited, terms])

  return (
    <div className="auto">
      <div className="panel">
        <div className="panelHeader">
          <h3>Live suggestions</h3>
          <div className="panelHeaderRight">
            <span className="pill mini">
              dataset: <span className="mono">rxterms</span>
            </span>
          </div>
        </div>

        <div className="row3">
          <div className="group">
            <label className="label" htmlFor="mode">
              Mode
            </label>
            <select
              id="mode"
              className="input"
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
            >
              <option value="debounce">debounce</option>
              <option value="throttle">throttle</option>
            </select>
          </div>
          <div className="group">
            <label className="label" htmlFor="wait">
              waitMs
            </label>
            <input
              id="wait"
              className="input"
              inputMode="numeric"
              value={waitMsStr}
              onChange={(e) => setWaitMsStr(e.target.value)}
            />
          </div>
          <div className="group">
            <label className="label">Controls</label>
            <div className="row">
              <button
                type="button"
                className="btn mini"
                onClick={() => {
                  rateLimited.cancel()
                  acRef.current?.abort()
                  setPending(false)
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn mini"
                onClick={() => {
                  setPending(true)
                  void rateLimited.flush()
                    .then((next) => {
                      if (next) setItems(next)
                    })
                    .catch((e) => setErr(errorToSummary(e).title))
                    .finally(() => setPending(false))
                }}
              >
                Flush
              </button>
            </div>
          </div>
        </div>

        <div className="group">
          <label className="label" htmlFor="autoTerms">
            terms
          </label>
          <input
            id="autoTerms"
            className="input"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Type…"
          />
          <div className="muted small">
            pending: <span className="mono">{String(pending)}</span> · calls:{' '}
            <span className="mono">{calls}</span>
          </div>
        </div>

        {err && (
          <div className="callout danger">
            <div className="calloutTitle">{err}</div>
          </div>
        )}

        <div className="autoList" role="listbox" aria-label="Suggestions">
          {items.length === 0 ? (
            <div className="muted small">No suggestions.</div>
          ) : (
            items.map((it) => (
              <div key={it.code} className="autoItem">
                <div className="autoMain">{it.display?.[0] ?? it.code}</div>
                <div className="muted tiny">{it.display?.[1] ?? it.code}</div>
              </div>
            ))
          )}
        </div>

        <CodeBlock
          title="Rate-limited code"
          code={[
            `import { ClinicalTablesClient, datasets, ${mode} } from 'clinical-table-search-sdk'`,
            ``,
            `const client = ClinicalTablesClient.builder()`,
            `  .baseUrl(${formatTsString(props.baseUrl)})`,
            `  .build()`,
            ``,
            `const rxterms = client.dataset(datasets.rxterms)`,
            ``,
            `const search = ${mode}(async (terms: string) => {`,
            `  return rxterms.search({ terms, maxList: 8 })`,
            `}, ${waitMs})`,
          ].join('\n')}
        />
      </div>
    </div>
  )
}

import { defineDataset } from "../dataset";

export const hcpcs = defineDataset({
  id: "hcpcs",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/hcpcs/v3/doc.html",
  fields: [
    "code",
    "short_desc",
    "long_desc",
    "display",
    "add_dt",
    "term_dt",
    "act_eff_dt",
    "obsolete",
    "is_noc",
  ] as const,
  defaults: {
    df: ["code", "display"],
  },
});

export const hpo = defineDataset({
  id: "hpo",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/hpo/v3/doc.html",
  fields: [
    "id",
    "name",
    "definition",
    "def_xref",
    "created_by",
    "creation_date",
    "comment",
    "is_obsolete",
    "replaced_by",
    "consider",
    "alt_id",
    "synonym",
    "synonym.term",
    "synonym.relation",
    "synonym.type",
    "synonym.xref",
    "is_a",
    "is_a.id",
    "is_a.name",
    "xref",
    "xref.id",
    "xref.name",
    "property",
    "property.name",
    "property.value",
    "property.data_type",
    "property.xref",
  ] as const,
  defaults: {
    df: ["id", "name"],
  },
});

export const icd11_codes = defineDataset<{
  /**
   * When present, limits results to stem codes, extension codes, or categories.
   * If absent, searches stem and extension codes.
   */
  type?: "stem" | "extension" | "category";
}>({
  id: "icd11_codes",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/icd11_codes/v3/doc.html",
  fields: [
    "code",
    "title",
    "definition",
    "type",
    "chapter",
    "entityId",
    "source",
    "browserUrl",
    "parent",
  ] as const,
  defaults: {
    df: ["code", "title", "type"],
    sf: ["code", "title"],
  },
});

export const icd9cm_dx = defineDataset({
  id: "icd9cm_dx",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/icd9cm_dx/v3/doc.html",
  fields: ["code", "code_dotted", "short_name", "long_name"] as const,
  defaults: {
    df: ["code", "long_name"],
  },
});

export const icd9cm_sg = defineDataset({
  id: "icd9cm_sg",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/icd9cm_sg/v3/doc.html",
  fields: ["code", "code_dotted", "short_name", "long_name"] as const,
  defaults: {
    df: ["code", "long_name"],
  },
});

export const loinc_items = defineDataset<{
  /**
   * Optional, with a default of false. If set to true, the data returned will
   * exclude LOINC questions and forms that contain copyrighted text.
   */
  excludeCopyrighted?: boolean;
  /**
   * Optional. If set, limits the returned results to question, form, panel,
   * or form_and_section (see API docs for current behavior).
   */
  type?: "question" | "form" | "form_and_section" | "panel";
  /**
   * Optional. If set to true, only results that can be retrieved via the LOINC
   * "RetrieveForm" API will be returned.
   */
  available?: boolean;
}>({
  id: "loinc_items",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/loinc/v3/doc.html",
  fields: [
    "text",
    "LOINC_NUM",
    "RELATEDNAMES2",
    "PROPERTY",
    "METHOD_TYP",
    "AnswerLists",
    "units",
    "datatype",
    "isCopyrighted",
    "containsCopyrighted",
    "CONSUMER_NAME",
    "LONG_COMMON_NAME",
    "SHORTNAME",
    "COMPONENT",
    "EXTERNAL_COPYRIGHT_NOTICE",
    "EXTERNAL_COPYRIGHT_LINK",
  ] as const,
  defaults: {
    df: ["text", "LOINC_NUM"],
    excludeCopyrighted: true,
  },
});

// Alias for ergonomics; the API id is "loinc_items".
export const loinc = loinc_items;

export const procedures = defineDataset({
  id: "procedures",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/procedures/v3/doc.html",
  fields: [
    "primary_name",
    "consumer_name",
    "key_id",
    "term_icd9_code",
    "term_icd9_text",
    "word_synonyms",
    "synonyms",
    "info_link_data",
  ] as const,
  defaults: {
    df: ["primary_name", "consumer_name"],
  },
});

export const conditions = defineDataset({
  id: "conditions",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/conditions/v3/doc.html",
  fields: [
    "primary_name",
    "consumer_name",
    "key_id",
    "icd10cm_codes",
    "icd10cm",
    "term_icd9_code",
    "term_icd9_text",
    "word_synonyms",
    "synonyms",
    "info_link_data",
  ] as const,
  defaults: {
    df: ["primary_name", "consumer_name"],
  },
});

export const npi_idv = defineDataset({
  id: "npi_idv",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/npi_idv/v3/doc.html",
  fields: [
    "NPI",
    "provider_type",
    "gender",
    "name.full",
    "addr_practice.full",
    "licenses",
    "licenses.taxonomy",
    "licenses.taxonomy.code",
    "licenses.taxonomy.grouping",
    "licenses.taxonomy.classification",
    "licenses.taxonomy.specialization",
    "licenses.medicare",
    "licenses.medicare.spc_code",
    "licenses.medicare.type",
    "name",
    "name.last",
    "name.first",
    "name.middle",
    "name.credential",
    "name.prefix",
    "name.suffix",
    "addr_practice",
    "addr_practice.line1",
    "addr_practice.line2",
    "addr_practice.city",
    "addr_practice.state",
    "addr_practice.zip",
    "addr_practice.phone",
    "addr_practice.fax",
    "addr_practice.country",
    "addr_mailing",
    "addr_mailing.full",
    "addr_mailing.line1",
    "addr_mailing.line2",
    "addr_mailing.city",
    "addr_mailing.state",
    "addr_mailing.zip",
    "addr_mailing.phone",
    "addr_mailing.fax",
    "addr_mailing.country",
    "name_other",
    "name_other.full",
    "name_other.last",
    "name_other.first",
    "name_other.middle",
    "name_other.credential",
    "name_other.prefix",
    "name_other.suffix",
    "other_ids",
    "other_ids.id",
    "other_ids.type",
    "other_ids.issuer",
    "other_ids.state",
    "misc",
    "misc.auth_official",
    "misc.auth_official.last",
    "misc.auth_official.first",
    "misc.auth_official.middle",
    "misc.auth_official.credential",
    "misc.auth_official.title",
    "misc.auth_official.prefix",
    "misc.auth_official.suffix",
    "misc.auth_official.phone",
    "misc.replacement_NPI",
    "misc.EIN",
    "misc.enumeration_date",
    "misc.last_update_date",
    "misc.is_sole_proprietor",
    "misc.is_org_subpart",
    "misc.parent_LBN",
    "misc.parent_TIN",
  ] as const,
  defaults: {
    df: ["NPI", "name.full", "provider_type", "addr_practice.full"],
  },
});

export const npi_org = defineDataset({
  id: "npi_org",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/npi_org/v3/doc.html",
  fields: [
    "NPI",
    "provider_type",
    "name.full",
    "addr_practice.full",
    "licenses",
    "licenses.taxonomy",
    "licenses.taxonomy.code",
    "licenses.taxonomy.grouping",
    "licenses.taxonomy.classification",
    "licenses.taxonomy.specialization",
    "licenses.medicare",
    "licenses.medicare.spc_code",
    "licenses.medicare.type",
    "name",
    "name.last",
    "name.first",
    "name.middle",
    "name.credential",
    "name.prefix",
    "name.suffix",
    "addr_practice",
    "addr_practice.line1",
    "addr_practice.line2",
    "addr_practice.city",
    "addr_practice.state",
    "addr_practice.zip",
    "addr_practice.phone",
    "addr_practice.fax",
    "addr_practice.country",
    "addr_mailing",
    "addr_mailing.full",
    "addr_mailing.line1",
    "addr_mailing.line2",
    "addr_mailing.city",
    "addr_mailing.state",
    "addr_mailing.zip",
    "addr_mailing.phone",
    "addr_mailing.fax",
    "addr_mailing.country",
    "name_other",
    "name_other.full",
    "name_other.last",
    "name_other.first",
    "name_other.middle",
    "name_other.credential",
    "name_other.prefix",
    "name_other.suffix",
    "other_ids",
    "other_ids.id",
    "other_ids.type",
    "other_ids.issuer",
    "other_ids.state",
    "misc",
    "misc.auth_official",
    "misc.auth_official.last",
    "misc.auth_official.first",
    "misc.auth_official.middle",
    "misc.auth_official.credential",
    "misc.auth_official.title",
    "misc.auth_official.prefix",
    "misc.auth_official.suffix",
    "misc.auth_official.phone",
    "misc.replacement_NPI",
    "misc.EIN",
    "misc.enumeration_date",
    "misc.last_update_date",
    "misc.is_sole_proprietor",
    "misc.is_org_subpart",
    "misc.parent_LBN",
    "misc.parent_TIN",
  ] as const,
  defaults: {
    df: ["NPI", "name.full", "provider_type", "addr_practice.full"],
  },
});

export const rxterms = defineDataset({
  id: "rxterms",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/rxterms/v3/doc.html",
  fields: [
    "DISPLAY_NAME",
    "STRENGTHS_AND_FORMS",
    "RXCUIS",
    "SXDG_RXCUI",
    "DISPLAY_NAME_SYNONYM",
  ] as const,
  defaults: {
    df: ["DISPLAY_NAME", "STRENGTHS_AND_FORMS"],
  },
});

export const ucum = defineDataset({
  id: "ucum",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/ucum/v3/doc.html",
  fields: [
    "cs_code",
    "name",
    "category",
    "synonyms",
    "loinc_property",
    "guidance",
    "source",
    "is_simple",
    "cs_code_tokens",
  ] as const,
  defaults: {
    df: ["cs_code", "name"],
  },
});

export const variants = defineDataset({
  id: "variants",
  version: "v4",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/variants/v4/doc.html",
  fields: [
    "AlternateAllele",
    "AlleleID",
    "AminoAcidChange",
    "Chromosome",
    "ChromosomeAccession",
    "Cytogenetic",
    "dbSNP",
    "GeneID",
    "GeneSymbol",
    "GenomicLocation",
    "hgnc_id",
    "hgnc_id_num",
    "HGVS_c",
    "HGVS_exprs",
    "HGVS_p",
    "Name",
    "NucleotideChange",
    "phenotypes",
    "phenotype",
    "phenotype.code",
    "phenotype.text",
    "PhenotypeIDS",
    "PhenotypeList",
    "RefSeqID",
    "ReferenceAllele",
    "Start",
    "Stop",
    "Type",
    "VariationID",
  ] as const,
  defaults: {
    df: ["GeneSymbol", "Name"],
  },
});

export const cosmic = defineDataset<{
  /** Genome reference build version (37 or 38). */
  grchv?: 37 | 38;
}>({
  id: "cosmic",
  version: "v4",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/cosmic/v4/doc.html",
  fields: [
    "AccessionNumber",
    "GeneCDS_Length",
    "GeneName",
    "HGNC_ID",
    "MutationAA",
    "MutationCDS",
    "MutationDescription",
    "MutationGenomePosition",
    "MutationStrand",
    "MutationID",
    "LegacyMutationID",
    "GenomicMutationID",
    "Name",
    "PrimaryHistology",
    "PrimarySite",
    "PubmedPMID",
    "Site",
    "GRChVer",
    "COSMIC_GENE_ID",
    "COSMIC_PHENOTYPE_ID",
  ] as const,
  defaults: {
    df: ["MutationID", "GeneName", "MutationDescription"],
    grchv: 38,
  },
});

export const cosmic_struct = defineDataset<{
  /** Genome reference build version (37 or 38). */
  grchv?: 37 | 38;
}>({
  id: "cosmic_struct",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/cosmic_struct/v3/doc.html",
  fields: [
    "BreakPointOrder",
    "ChromFrom",
    "ChromTo",
    "Description",
    "ID_STUDY",
    "LocationFromMax",
    "LocationFromMin",
    "LocationToMax",
    "LocationToMin",
    "MutationID",
    "MutationType",
    "NonTemplatedInsSeq",
    "PrimaryHistology",
    "PrimarySite",
    "Site",
    "StrandFrom",
    "StrandTo",
    "GRChVer",
    "COSMIC_STRUCTURAL_ID",
    "COSMIC_PHENOTYPE_ID",
    "COSMIC_STUDY_ID",
  ] as const,
  defaults: {
    df: ["MutationID", "Description"],
    grchv: 38,
  },
});

export const cytogenetic_locs = defineDataset({
  id: "cytogenetic_locs",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/cytogenetic_locs/v3/doc.html",
  fields: [
    "chromosome",
    "arm",
    "band",
    "iscn_start",
    "iscn_stop",
    "stain",
    "cytogenetic",
  ] as const,
  defaults: {
    df: ["chromosome", "arm", "band"],
  },
});

export const dbvar = defineDataset<{
  autocomp?: 0 | 1;
}>({
  id: "dbvar",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/dbvar/v3/doc.html",
  fields: [
    "Alias",
    "ciend",
    "cipos",
    "clinical_int",
    "copy_number",
    "Dbxref",
    "End_range",
    "FeatureEnd",
    "FeatureStart",
    "gender",
    "ID",
    "Name",
    "parent",
    "phenotype",
    "sampleset_name",
    "sampleset_type",
    "SeqID",
    "Start_range",
    "Type",
    "var_origin",
    "Zygosity",
  ] as const,
  defaults: {
    df: ["ID", "Name", "Type"],
  },
});

export const disease_names = defineDataset({
  id: "disease_names",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/disease_names/v3/doc.html",
  fields: ["DiseaseName", "ConceptID"] as const,
  defaults: {
    df: ["DiseaseName"],
  },
});

export const genes = defineDataset({
  id: "genes",
  version: "v4",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/genes/v4/doc.html",
  fields: [
    "hgnc_id",
    "hgnc_id_num",
    "symbol",
    "location",
    "alias_symbol",
    "prev_symbol",
    "refseq_accession",
    "name",
    "name_mod",
    "alias_name",
    "prev_name",
  ] as const,
  defaults: {
    df: ["symbol", "name_mod"],
  },
});

export const refseqs = defineDataset({
  id: "refseqs",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/refseqs/v3/doc.html",
  fields: ["RefSeq", "gene", "NP_RefSeq", "NC_RefSeq"] as const,
  defaults: {
    df: ["RefSeq", "gene"],
  },
});

export const snps = defineDataset({
  id: "snps",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/snps/v3/doc.html",
  fields: [
    "rsNum",
    "38.alleles",
    "38.chr",
    "38.pos",
    "38.gene",
    "38.assembly",
    "38.seqID",
    "37.alleles",
    "37.chr",
    "37.pos",
    "37.gene",
    "37.assembly",
    "37.seqID",
  ] as const,
  defaults: {
    df: ["rsNum"],
  },
});

export const star_alleles = defineDataset({
  id: "star_alleles",
  version: "v3",
  docUrl: "https://clinicaltables.nlm.nih.gov/apidoc/star_alleles/v3/doc.html",
  fields: [
    "StarAlleleName",
    "GenBank",
    "ProteinAffected",
    "cDNANucleotideChanges",
    "GeneNucleotideChange",
    "XbaIHaplotype",
    "RFLP",
    "OtherNames",
    "ProteinChange",
    "InVivoEnzymeActivity",
    "InVitroEnzymeActivity",
    "References",
    "ClinicalPhenotype",
    "Notes",
  ] as const,
  defaults: {
    df: ["StarAlleleName", "GeneNucleotideChange", "ProteinChange"],
  },
});
